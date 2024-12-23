import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BankModule } from './bank/bank.module';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { DepositModule } from './deposit/deposit.module';
import { AppLoggerMiddleware } from './middleware/logger.middleware';
import { PrismaService } from './prisma.service';
import { TransactionModule } from './transaction/transaction.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { StaffsModule } from './staffs/staffs.module';
import { DebtsModule } from './debts/debts.module';
import { OtpModule } from './otp/otp.module';
import { AppMailerModule } from './mailer/mailer.module';
import { KafkaModule } from './kafka/kafka.module';
import { NotificationModule } from './notification/notification.module';
import { AccountsModule } from './accounts/accounts.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot(),
    TransactionModule,
    DepositModule,
    BankModule,
    BeneficiariesModule,
    CustomersModule,
    StaffsModule,
    DebtsModule,
    OtpModule,
    AppMailerModule,
    KafkaModule,
    NotificationModule,
    AccountsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
