import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { PrismaService } from 'src/prisma.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { AccountsService } from 'src/accounts/accounts.service';
import { OtpModule } from 'src/otp/otp.module';
import { AppMailerModule } from 'src/mailer/mailer.module';
import { CustomersModule } from 'src/customers/customers.module';
import { RsaService } from 'src/partner/rsa.service';
import { BankService } from 'src/bank/bank.service';

@Module({
  imports: [
    OtpModule,
    AppMailerModule,
    CustomersModule,
    HttpModule
  ],
  controllers: [DepositController],
  providers: [
    DepositService,
    PrismaService,
    TransactionService,
    AccountsService,
    RsaService,
    BankService,
  ],
})
export class DepositModule {}
