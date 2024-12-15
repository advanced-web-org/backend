import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { QueryTestingService } from './query_testing/query_testing.service';
import { QueryTestingController } from './query_testing/query_testing.controller';
import { PrismaService } from './prisma.service';
import { DebtsController } from './debts/debts.controller';
import { DebtsService } from './debts/debts.service';
import { DebtsModule } from './debts/debts.module';

@Module({
  imports: [AuthModule, UsersModule, ConfigModule.forRoot(), DebtsModule],
  controllers: [AppController, QueryTestingController],
  providers: [AppService, QueryTestingService, PrismaService],
})
export class AppModule {}
