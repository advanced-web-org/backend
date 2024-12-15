import { Module } from '@nestjs/common';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';
import { PrismaService } from 'src/prisma.service';
import DebtsValidator from './validator/debts.validator';

@Module({
  imports: [],
  controllers: [DebtsController],
  providers: [DebtsService, PrismaService, DebtsValidator],
})
export class DebtsModule {}
