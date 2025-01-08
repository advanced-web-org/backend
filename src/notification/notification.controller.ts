import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Notification API')
@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @ApiOperation({ summary: 'Get all notifications for a user' })
  @Get('/:userId')
  async getNotifications(@Param('userId') userId: number) {
    return this.notificationService.getNotifications(+userId);
  }

  @ApiOperation({ summary: 'Mark a notification as read' })
  @Patch('/:notificationId')
  async markAsRead(@Param('notificationId') notificationId: number) {
    return this.notificationService.markAsRead(+notificationId);
  }
}
