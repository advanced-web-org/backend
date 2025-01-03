import { Module } from '@nestjs/common';
import { AccountsService } from 'src/accounts/accounts.service';
import { PrismaService } from 'src/prisma.service';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { OtpModule } from 'src/otp/otp.module';
import { AppMailerModule } from 'src/mailer/mailer.module';
import { CustomersModule } from 'src/customers/customers.module';

@Module({
  imports: [
    OtpModule,
    AppMailerModule,
    CustomersModule
  ],
  controllers: [TransactionController],
  providers: [TransactionService, PrismaService, AccountsService],
})
export class TransactionModule {}
