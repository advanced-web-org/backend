import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma.service';
import { CustomersService } from 'src/customers/customers.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, CustomersService],
})
export class AuthModule {}
