import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AccountsService } from 'src/accounts/accounts.service';
import { BankService } from 'src/bank/bank.service';
import { CustomersService } from 'src/customers/customers.service';
import { AppMailerService } from 'src/mailer/mailer.service';
import { OtpService } from 'src/otp/otp.service';
import { PrismaService } from 'src/prisma.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';
import { RsaService } from './rsa.service';

@Module({
  imports: [HttpModule],
  controllers: [PartnerController],
  providers: [
    PartnerService,
    PrismaService,
    TransactionService,
    BankService,
    RsaService,
    AccountsService,
    OtpService,
    AppMailerService,
    CustomersService,
  ],
})
export class PartnerModule {}
