import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { PrismaService } from 'src/prisma.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Module({
  controllers: [DepositController],
  providers: [DepositService, PrismaService, TransactionService],
})
export class DepositModule {}
