import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Kafka } from 'kafkajs';
import { KafkaModule } from 'src/kafka/kafka.module';
import { NotificationController } from './notification.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [KafkaModule,],
  providers: [NotificationService, PrismaService],
  exports: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
