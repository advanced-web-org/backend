import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { PrismaService } from 'src/prisma.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { AccountsService } from 'src/accounts/accounts.service';
import { OtpModule } from 'src/otp/otp.module';
import { AppMailerModule } from 'src/mailer/mailer.module';
import { CustomersModule } from 'src/customers/customers.module';

@Module({
  imports: [
    OtpModule,
    AppMailerModule,
    CustomersModule
  ],
  controllers: [DepositController],
  providers: [
    DepositService,
    PrismaService,
    TransactionService,
    AccountsService,
  ],
})
export class DepositModule {}
