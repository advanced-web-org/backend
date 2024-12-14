import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { QueryTestingService } from './query_testing/query_testing.service';
import { QueryTestingController } from './query_testing/query_testing.controller';
import { PrismaService } from './prisma.service';
import { TransactionModule } from './transaction/transaction.module';
import { DepositModule } from './deposit/deposit.module';

@Module({
  imports: [AuthModule, UsersModule, ConfigModule.forRoot(), TransactionModule, DepositModule],
  controllers: [AppController, QueryTestingController],
  providers: [AppService, QueryTestingService, PrismaService],
})
export class AppModule {}
