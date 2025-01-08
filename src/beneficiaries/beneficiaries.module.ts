import { Module } from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service';
import { BeneficiariesController } from './beneficiaries.controller';
import { PrismaService } from 'src/prisma.service';
import { CustomersService } from 'src/customers/customers.service';
import { AccountsService } from 'src/accounts/accounts.service';
import { PartnerModule } from 'src/partner/partner.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PartnerModule, HttpModule],
  controllers: [BeneficiariesController],
  providers: [BeneficiariesService, PrismaService, CustomersService, AccountsService],
})
export class BeneficiariesModule {}
