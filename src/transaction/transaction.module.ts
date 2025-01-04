import { Module } from '@nestjs/common';
import { AccountsService } from 'src/accounts/accounts.service';
import { PrismaService } from 'src/prisma.service';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { OtpModule } from 'src/otp/otp.module';
import { AppMailerModule } from 'src/mailer/mailer.module';
import { CustomersModule } from 'src/customers/customers.module';
import { HttpModule } from '@nestjs/axios';
import { RsaService } from 'src/partner/rsa.service';
import { BankService } from 'src/bank/bank.service';

@Module({
  imports: [
    OtpModule,
    AppMailerModule,
    CustomersModule,
    HttpModule
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    PrismaService,
    AccountsService,
    RsaService,
    BankService,
  ],
})
export class TransactionModule {}
