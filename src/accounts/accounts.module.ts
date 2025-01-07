import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { PrismaService } from 'src/prisma.service';
import { PartnerModule } from 'src/partner/partner.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PartnerModule, HttpModule],
  controllers: [AccountsController],
  providers: [AccountsService, PrismaService],
  exports: [AccountsService],
})
export class AccountsModule {}
