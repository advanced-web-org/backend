import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: "secret",
    })
  ],
  controllers: [],
  providers: [OtpService, PrismaService],
  exports: [OtpService],
})
export class OtpModule {}
