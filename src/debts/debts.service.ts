import { BadRequestException, InternalServerErrorException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import CreateDebtDto from './dto/create-debt.dto';
import { OtpService } from 'src/otp/otp.service';
import { AppMailerService } from 'src/mailer/mailer.service';
import { assert } from 'console';
import { KafkaService } from 'src/kafka/kafka.service';
import { DebtNotification } from 'src/notification/types/debt-notification.type';
import { OtpData } from 'src/otp/types/otp-data.type';
import { Debt, debt_status, trans_type } from '@prisma/client';
import { numberToCurrency } from './utils/currency.utils';
import { TransactionService } from 'src/transaction/transaction.service';

export enum DebtAction {
  PAID = 'PAID',
  DELETED = 'DELETED',
  CREATED = 'CREATED'
}
export interface DebtKafkaMessage {
  userIdToSend: number;
  debtId: number;
  message: string;
  userMessage?: string;
  timestamp: string;
  action: DebtAction;
}

@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly mailer: AppMailerService,
    private readonly kafkaService: KafkaService,
    private readonly transactionService: TransactionService,
  ) { }

  async createDebt(createDebtDto: CreateDebtDto) {
    const createdDebt = await this.prisma.debt.create({
      data: createDebtDto,
    });

    const creditor = await this.prisma.customer.findUnique({ where: { customer_id: createDebtDto.creditor_id } });

    this.kafkaService.produce<DebtKafkaMessage>('debt-notifications', {
      userIdToSend: createDebtDto.debtor_id,
      message: `You have a new debt reminder of ${numberToCurrency(createDebtDto.debt_amount)} from ${creditor?.full_name}`,
      userMessage: createDebtDto.debt_message,
      debtId: 1,
      timestamp: new Date().toISOString(),
      action: DebtAction.CREATED
    });

    console.log('Debt created successfully and produce kafka message`');
    return createdDebt;
  }
  private async checkAccountExistence(accountId: number, accountRole: 'Creditor' | 'Debtor') {
    const account = await this.prisma.account.findUnique({ where: { account_id: accountId } });
    if (!account) {
      throw new BadRequestException(`${accountRole} account with ID ${accountId} was not found.`);
    }
    return account;
  }

  async getCreditorDebts(creditorId: number, status?: debt_status): Promise<Debt[]> {
    const where: { creditor_id: number; status?: debt_status } = { creditor_id: creditorId };
  
    if (status) {
      where.status = status;
    }
  
    return await this.getDebts(where);
  }
  
  async getDebtorDebts(debtorId: number, status?: debt_status): Promise<Debt[]> {
    const where: { debtor_id: number; status?: debt_status } = { debtor_id: debtorId };
  
    if (status) {
      where.status = status;
    }
  
    return await this.getDebts(where);
  }
  

  private async getDebts(where: any): Promise<Debt[]> {
    return await this.prisma.debt.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        creditor: {
          select: {
            customer_id: true,
            full_name: true,
          },
        },
        debtor: {
          select: {
            customer_id: true,
            full_name: true,
          },
        },
        debtDeletion: {
          select: {
            deleter_id: true,
            delete_message: true,
            created_at: true,
          },
        },
      },
    });
  }
  
  async initiatePayment(debtId: number, userId: number) {

    const debt = await this.prisma.debt.findUnique({ where: { debt_id: debtId } });
    if (!debt) {
      throw new BadRequestException('Debt not found');
    }

    
    // Send email to user with the OTP
    const customerId = debt.debtor_id;
    if (userId !== customerId) {
      throw new BadRequestException('You are not authorized to pay this debt');
    }
    const customer = await this.prisma.customer.findUnique({ where: { customer_id: customerId } });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }
    if (!customer.email) {
      throw new InternalServerErrorException('Bad data! Customer email is null');
    }

    const { otp, expiresAt }: OtpData = await this.otpService.getOtpData();
    await this.mailer.sendOtpEmail(customer.email, otp);

    return {
      otpToken: await this.otpService.getOtpToken({otp, expiresAt}, customerId),
      message: `OTP sent to your email ${customer.email}`
    };
  }

  async verifyOtpAndPayDebt(userId: number, debtId: number, otp: string, otpToken: string) {
    console.log('verifying', otp, otpToken, userId);

    await this.otpService.verifyOtpToken(otp, otpToken, userId);

    // make a transaction using the transaction service
    const currentDebt = await this.prisma.debt.findUnique({
      where: { debt_id: debtId }
    });
    if (!currentDebt) {
      throw new BadRequestException('Debt not found');
    }

    const creditorAccount = await this.prisma.account.findFirst({
      where: { customer_id: currentDebt.creditor_id }
    });
    if (!creditorAccount) {
      throw new BadRequestException('Creditor account not found');
    }
    const debtorAccount = await this.prisma.account.findFirst({
      where: { customer_id: currentDebt.debtor_id }
    });
    if (!debtorAccount) {
      throw new BadRequestException('Debtor account not found');
    }

    const transaction = await this.transactionService.createInternalTransaction({
      from_bank_id: 1,
      from_account_number: debtorAccount.account_number,
      to_bank_id: 1,
      to_account_number: creditorAccount.account_number,
      transaction_type: trans_type.transaction,
      transaction_amount: Number(currentDebt.debt_amount),
      transaction_message: 'Debt payment',
      fee_payer: 'from',
      fee_amount: 0,
    });

    await this.prisma.debtPayment.create({
      data: {
        debt_id: debtId,
        transaction_id: transaction.transaction_id,
      },
    });

    const debt = await this.prisma.debt.update({
      where: { debt_id: debtId },
      data: { status: debt_status.paid },
      select: {
        creditor_id: true,
        debtor_id: true,
        debt_amount: true,
        debtor: true
      },
    });

    const message = `${debt.debtor.full_name} just paid a debt of ${numberToCurrency(Number(debt.debt_amount))}.`;
    const created_at = new Date().toISOString();
    // Publish Kafka message to notify the creditor
    console.log('publishing kafka message for debt paid');
    await this.kafkaService.produce<DebtKafkaMessage>('debt-notifications', {
      userIdToSend: debt.creditor_id,
      message: message,
      debtId: debtId,
      timestamp: created_at,
      action: DebtAction.PAID
    });

    return { message: 'Debt paid successfully' };
  }

  async deleteDebt(debtId: number, delete_message: string, userId: number) {
    const debt = await this.prisma.debt.findUnique({ where: { debt_id: debtId } });
    if (!debt) {
      throw new BadRequestException('Debt not found');
    }

    if (userId !== debt.creditor_id && userId !== debt.debtor_id) {
      console.log('kiet userId', userId);
      throw new BadRequestException('You are not authorized to delete this debt');
    }

    if (debt.status === debt_status.deleted) {
      throw new BadRequestException('Debt has already been deleted');
    }

    if (debt.status === debt_status.paid) {
      throw new BadRequestException('Debt has already been paid');
    }

    await this.prisma.debt.update({
      where: { debt_id: debtId },
      data: { status: debt_status.deleted },
    });

    await this.prisma.debtDeletion.create({
      data: {
        debt_id: debtId,
        deleter_id: userId,
        delete_message: delete_message,
      },
    });

    const userIdToSendNotification = this.isCreditor(userId, debt.creditor_id) ? debt.debtor_id : debt.creditor_id;
    const message = `Your ${this.isCreditor(userId, debt.creditor_id) ? 'creditor' : 'debtor'} has just deleted a debt of ${numberToCurrency(Number(debt.debt_amount))}.`;
    const created_at = new Date().toISOString();
    // Publish Kafka message to notify the user
    await this.kafkaService.produce<DebtKafkaMessage>('debt-notifications', {
      userIdToSend: userIdToSendNotification,
      message: message,
      debtId: debtId,
      timestamp: new Date().toISOString(),
      action: DebtAction.DELETED
    });

    return { message: 'Debt deleted successfully' };
  }

  private isCreditor(userId: number, creditorId: number) {
    return userId === creditorId;
  }
}
