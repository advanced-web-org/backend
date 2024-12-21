import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  generateOtp(length = 6): string {
    // Generate a numeric OTP of given length
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }

  // Optional: Hash OTP before storing, if you want added security.
  hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  verifyOtp(plainOtp: string, hashedOtp: string): boolean {
    return this.hashOtp(plainOtp) === hashedOtp;
  }
}
