import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { KafkaService } from '../kafka/kafka.service';
import { DebtNotification } from './types/debt-notification.type';

@Injectable()
export class NotificationService implements OnModuleInit {
  private io: Server;

  constructor(
    private kafkaService: KafkaService
  ) { }

  onModuleInit() {
    this.io = new Server(3001, { cors: { origin: '*' } });

    // Listen for WebSocket connections
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('join', (data) => {
        const { room } = data;
        socket.join(room); // Join the creditor's room
        console.log(`Client joined room: ${room}`);
      });
    });

    // Start consuming Kafka messages
    this.kafkaService.consume<DebtNotification>('debt-notifications', 'notification-group', (message) => {
      this.handleDebtNotification(message);
    });
  }

  handleDebtNotification(message: DebtNotification) {
    const { creditorId, ...notification } = message;
    this.io.to(String(creditorId)).emit('debt-notification', notification);
  }
}
