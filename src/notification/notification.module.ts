import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Kafka } from 'kafkajs';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
