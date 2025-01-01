import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { KafkaService } from '../kafka/kafka.service';
import { DebtNotification } from './types/debt-notification.type';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';

// socket-events.ts
export interface ClientToServerEvents {
  join: (userId: number) => void;
}

export interface ServerToClientEvents {
  debtNotifications: (data: DebtNotification) => void;
}


@Injectable()
export class NotificationService implements OnModuleInit {
  private io: Server;

  constructor(
    private kafkaService: KafkaService,
    private prisma: PrismaService,
    private jwt: JwtService
  ) { }

  onModuleInit() {
    this.io = new Server<ClientToServerEvents, ServerToClientEvents>(3001, { cors: { origin: '*' } });

    this.io.use((socket, next) => {
      const token: string = socket.handshake.query.token?.at(0) || '';
    
      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }
    
      try {
        // const decoded = this.jwt.verify(token, "secret");
        // socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error("Authentication error: Invalid token"));
      }
    });

    // Listen for WebSocket connections
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.data.userId}`);

      socket.on('join', (userId) => {
        socket.join(userId); // Join the creditor's room
        console.log(`Client joined room: ${userId}`);
      });
    });

    // Start consuming Kafka messages
    this.kafkaService.consume<DebtNotification>('debt-notifications', 'notification-group', (message) => {
      this.handleDebtNotification(message);
    });
    this.kafkaService.consume<DebtNotification>('debt-notifications', 'notification-group', (message) => {
      this.handleDebtNotification(message);
    });
  }

  async handleDebtNotification(message: DebtNotification) {
    const { userIdToSend, ...notification } = message;
    await this.prisma.notification.create({
      data: {
        message: notification.message,
        user_id: userIdToSend,
        created_at: notification.timestamp,
      },
    });
    this.io.to(String(userIdToSend)).emit('debtNotifications', notification);
  }

  async getNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  } 

  async markAsRead(notificationId: number) {
    return this.prisma.notification.update({
      where: { notification_id: notificationId },
      data: { is_read: true },
    });
  }
}
