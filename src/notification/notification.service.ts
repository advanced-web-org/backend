import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { KafkaService } from '../kafka/kafka.service';
import { DebtNotification } from './types/debt-notification.type';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { DebtKafkaMessage } from 'src/debts/debts.service';

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
  ) {}

  onModuleInit() {
    // Initialize WebSocket Server
    this.io = new Server<ClientToServerEvents, ServerToClientEvents>(3001, {
      cors: { origin: '*' },
    });

    // WebSocket Authentication Middleware
    this.io.use((socket, next) => {
      const token: string = socket.handshake.query.token?.at(0) || '';
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      try {
        // const decoded = this.jwt.verify(token, "secret");
        // socket.data.userId = decoded.userId; // Attach userId to socket
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Listen for WebSocket connections
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle room joining
      socket.on('join', (userId) => {
        socket.join(String(userId)); // Join room with userId as room name
        console.log(`Client joined room: ${userId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    // Kafka consumer for debt notifications
    this.kafkaService.consume<DebtKafkaMessage>(
      'debt-notifications',
      'notification-group',
      (message) => this.handleDebtNotification(message)
    );
  }

  async handleDebtNotification(message: DebtKafkaMessage) {
    const { userIdToSend, ...kafkaMessage } = message;

    // Save notification to the database
    const savedNoti = await this.prisma.notification.create({
      data: {
        message: kafkaMessage.message,
        user_id: userIdToSend,
        created_at: kafkaMessage.timestamp,
      },
    });

    const liveNoti: DebtNotification = {
      notificationId: savedNoti.notification_id,
      message: kafkaMessage.message,
      timestamp: kafkaMessage.timestamp
    }

    // Emit the notification to the specific user
    console.log(`Notification sent to user: ${userIdToSend}, message: ${kafkaMessage.message}`);
    this.io.to(String(userIdToSend)).emit('debtNotifications', liveNoti);
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
