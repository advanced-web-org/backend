import { Module } from '@nestjs/common';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';
import { PrismaService } from 'src/prisma.service';
import DebtsValidator from './validator/debts.validator';
import { OtpModule } from 'src/otp/otp.module';
import { AppMailerModule } from 'src/mailer/mailer.module';
import { NotificationModule } from 'src/notification/notification.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
  imports: [OtpModule, AppMailerModule, NotificationModule, KafkaModule, TransactionModule],
  controllers: [DebtsController],
  providers: [DebtsService, PrismaService, DebtsValidator],
})
export class DebtsModule {}
