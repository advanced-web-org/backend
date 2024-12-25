import { BadRequestException, InternalServerErrorException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import CreateDebtDto from './dto/create-debt.dto';
import { DebtStatus } from './enum/debt-status.enum';
import { OtpService } from 'src/otp/otp.service';
import { AppMailerService } from 'src/mailer/mailer.service';
import { assert } from 'console';
import { KafkaService } from 'src/kafka/kafka.service';
import { DebtNotification } from 'src/notification/types/debt-notification.type';
import { OtpData } from 'src/otp/types/otp-data.type';

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

  async getCreditorDebts(creditorId: number, status?: DebtStatus) {
    const where: { creditor_id: number; status?: DebtStatus } = { creditor_id: creditorId };
  
    if (status !== undefined) {
      where.status = status;
    }
  
    return this.prisma.debt.findMany({ where });
  }
  
  async getDebtorDebts(debtorId: number, status?: DebtStatus) {
    const where: { debtor_id: number; status?: DebtStatus } = { debtor_id: debtorId };
  
    if (status !== undefined) {
      where.status = status;
    }
  
    return this.prisma.debt.findMany({ where });
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
      data: { status: DebtStatus.paid },
    });

    // Publish Kafka message to notify the creditor
    await this.kafkaService.produce<DebtNotification>('debt-notifications', {
      creditorId: debt.creditor_id,
      message: `Your debtor has just paid a debt of ${debt.debt_amount}.`,
      debtId: debtId,
      timestamp: new Date().toISOString(),
    });

    return { message: 'Debt paid successfully' };
  }
}
