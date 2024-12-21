import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { OtpData } from './types/otp-data.type';
import e from 'express';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) { }

  async getOtpData(length = 6, expiryMinutes = 5): Promise<OtpData> {
    const otp = this.generateOtp(length);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    return { otp, expiresAt };
  }

  async getOtpToken({ otp, expiresAt }: OtpData, userId: number): Promise<string> {
    const hashedOtp = this.hashString(otp);
    const hashedUserId = this.hashString(userId.toString());

    await this.prismaService.otpSession.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        hashed_otp: hashedOtp,
      },
      update: {
        hashed_otp: hashedOtp,
      }
    })

    return await this.jwtService.signAsync({ otp: hashedOtp, exp: expiresAt.getTime(), usr: hashedUserId });
  }

  async verifyOtpToken(plainOtp: string, otpToken: string, userId: number): Promise<void> {
    const { otp: hashedOtp, exp: expiresAt, usr: hashedUserId } = await this.jwtService.verifyAsync(otpToken, {
      secret: "secret",
    });

    const otpSession = await this.prismaService.otpSession.findUnique({
      where: { user_id: userId }
    });
    if (!otpSession) {
      throw new BadRequestException('OTP not found');
    }

    if (!otpSession.hashed_otp) {
      throw new BadRequestException('OTP is already used');
    }

    if (this.hashString(userId.toString()) !== hashedUserId) {
      throw new BadRequestException('You are not authorized to verify this OTP');
    }

    if (expiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    if (!this.verifyOtp(plainOtp, hashedOtp)) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.prismaService.otpSession.update({
      where: { user_id: userId },
      data: {
        hashed_otp: null,
      }
    });
  }

  private generateOtp(length = 6): string {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }

  private hashString(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  private verifyOtp(plainOtp: string, hashedOtp: string): boolean {
    return this.hashString(plainOtp) === hashedOtp;
  }
}
