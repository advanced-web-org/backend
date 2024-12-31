import { BadRequestException, InternalServerErrorException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import CreateDebtDto from './dto/create-debt.dto';
import { OtpService } from 'src/otp/otp.service';
import { AppMailerService } from 'src/mailer/mailer.service';
import { assert } from 'console';
import { KafkaService } from 'src/kafka/kafka.service';
import { DebtAction, DebtNotification } from 'src/notification/types/debt-notification.type';
import { OtpData } from 'src/otp/types/otp-data.type';
import { Debt, debt_status } from '@prisma/client';

@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly mailer: AppMailerService,
    private readonly kafkaService: KafkaService
  ) { }

  async createDebt(createDebtDto: CreateDebtDto) {
    return this.prisma.debt.create({
      data: createDebtDto,
    });
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

    await this.otpService.verifyOtpToken(otp, otpToken, userId);

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

    const message = `${debt.debtor.full_name} just paid a debt of ${debt.debt_amount}.`;
    const created_at = new Date().toISOString();
    // Publish Kafka message to notify the creditor
    await this.kafkaService.produce<DebtNotification>('debt-notifications', {
      userIdToSend: debt.creditor_id,
      message: message,
      debtId: debtId,
      timestamp: created_at,
      action: DebtAction.PAID
    });

    await this.prisma.notification.create({
      data: {
        user_id: debt.creditor_id,
        message: message,
        created_at: created_at,
      }
    });

    return { message: 'Debt paid successfully' };
  }

  async deleteDebt(debtId: number, userId: number) {
    const debt = await this.prisma.debt.findUnique({ where: { debt_id: debtId } });
    if (!debt) {
      throw new BadRequestException('Debt not found');
    }

    if (userId !== debt.creditor_id && userId !== debt.debtor_id) {
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

    const userIdToSendNotification = this.isCreditor(userId, debt.creditor_id) ? debt.debtor_id : debt.creditor_id;
    const message = `Your ${this.isCreditor(userId, debt.creditor_id) ? 'creditor' : 'debtor'} has just deleted a debt of ${debt.debt_amount}.`;
    const created_at = new Date().toISOString();
    // Publish Kafka message to notify the user
    await this.kafkaService.produce<DebtNotification>('debt-notifications', {
      userIdToSend: userIdToSendNotification,
      message: message,
      debtId: debtId,
      timestamp: new Date().toISOString(),
      action: DebtAction.DELETED
    });

    await this.prisma.notification.create({
      data: {
        user_id: userIdToSendNotification,
        message: message,
        created_at: created_at,
      }
    });

    return { message: 'Debt deleted successfully' };
  }

  private isCreditor(userId: number, creditorId: number) {
    return userId === creditorId;
  }
}
