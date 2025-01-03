import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
  ) { }
  
  @Get("/:userId")
  async getNotifications(@Param('userId') userId: number) {
    return this.notificationService.getNotifications(+userId);
  }

  @Patch("/:notificationId")
  async markAsRead(@Param('notificationId') notificationId: number) {
    return this.notificationService.markAsRead(+notificationId);
  }
}
