import { Module } from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service';
import { BeneficiariesController } from './beneficiaries.controller';
import { PrismaService } from 'src/prisma.service';
import { CustomersService } from 'src/customers/customers.service';
import { AccountsService } from 'src/accounts/accounts.service';

@Module({
  controllers: [BeneficiariesController],
  providers: [BeneficiariesService, PrismaService, CustomersService, AccountsService],
})
export class BeneficiariesModule {}
