import { BadRequestException, InternalServerErrorException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import CreateDebtDto from './dto/create-debt.dto';
import { DebtStatus } from './enum/debt-status.enum';
import { OtpService } from 'src/otp/otp.service';
import { AppMailerService } from 'src/mailer/mailer.service';
import { assert } from 'console';
import { KafkaService } from 'src/kafka/kafka.service';
import { DebtNotification } from 'src/notification/types/debt.notification';

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
  
  async initiatePayment(debtId: number) {
    // Check if user can pay this debt (e.g., belongs to them, status)
    if (debtId === undefined) {
      throw new BadRequestException('Debt ID is required');
    }
    const debt = await this.prisma.debt.findUnique({ where: { debt_id: debtId } });
    if (!debt) {
      throw new BadRequestException('Debt not found');
    }

    const customerId = debt.debtor_id;

    // Generate OTP
    const otp = this.otpService.generateOtp();
    const hashedOtp = this.otpService.hashOtp(otp);

    // Set expiration time (e.g., 5 minutes from now)
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Create or update PaymentSession
    const paymentSession = await this.prisma.paymentSession.upsert({
      where: { user_id_debt_id: { user_id: customerId, debt_id: debtId } },
      create: {
        user_id: customerId,
        debt_id: debtId,
        hashed_otp: hashedOtp,
        otp_expires_at: otpExpiresAt,
      },
      update: {
        hashed_otp: hashedOtp,
        otp_expires_at: otpExpiresAt,
      },
    });

    // Send email to user with the OTP
    // Assume user’s email can be fetched from user table
    const customer = await this.prisma.customer.findUnique({ where: { customer_id: customerId } });
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }
    if (!customer.email) {
      throw new InternalServerErrorException('Bad data! Customer email is null');
    }

    await this.mailer.sendOtpEmail(customer.email, otp);

    return { message: `OTP sent to your email ${customer.email}` };
  }

  async verifyOtpAndPayDebt(userId: number, debtId: number, otp: string) {
    const paymentSession = await this.prisma.paymentSession.findUnique({
      where: { user_id_debt_id: { user_id: userId, debt_id: debtId } },
    });

    if (!paymentSession || !paymentSession.hashed_otp || !paymentSession.otp_expires_at) {
      throw new BadRequestException('No payment session found. Initiate payment first.');
    }

    if (paymentSession.otp_expires_at < new Date()) {
      throw new BadRequestException('OTP expired');
    }
    
    if (!this.otpService.verifyOtp(otp, paymentSession.hashed_otp)) {
      throw new BadRequestException('Invalid OTP');
    }

    const debt = await this.prisma.debt.update({
      where: { debt_id: debtId },
      data: { status: DebtStatus.paid },
    });

    await this.prisma.paymentSession.update({
      where: { user_id_debt_id: { user_id: userId, debt_id: debtId } },
      data: { hashed_otp: null, otp_expires_at: null },
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
