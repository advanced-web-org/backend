// mailer.controller.ts
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AppMailerService } from './mailer.service';

@Controller('mailer')
export class AppMailerController {
  constructor(private readonly mailerService: AppMailerService) {}

  @Get('test-email')
  async testEmail(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email query parameter is required');
    }
    try {
      await this.mailerService.sendOtpEmail(email, '123456');
      return { message: `Test OTP sent to ${email}` };
    } catch (error) {
      return { message: `Failed to send test OTP: ${error.message}` };
    }
  }
}
