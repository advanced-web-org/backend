import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { PrismaService } from 'src/prisma.service';
import { AccountsService } from 'src/accounts/accounts.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, PrismaService, AccountsService],
})
export class CustomersModule {}
