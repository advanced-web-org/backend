import { Module } from '@nestjs/common';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';
import { PrismaService } from 'src/prisma.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { BankService } from 'src/bank/bank.service';
import { RsaService } from './rsa.service';
import { AccountsService } from 'src/accounts/accounts.service';
import { HttpModule } from '@nestjs/axios';

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
  ],
})
export class PartnerModule {}
