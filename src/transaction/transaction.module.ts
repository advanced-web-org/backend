import { Module } from '@nestjs/common';
import { AccountsService } from 'src/accounts/accounts.service';
import { PrismaService } from 'src/prisma.service';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, PrismaService, AccountsService],
})
export class TransactionModule {}
