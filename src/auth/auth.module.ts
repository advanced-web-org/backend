import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma.service';
import { CustomersService } from 'src/customers/customers.service';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { StaffsService } from 'src/staffs/staffs.service';
import { OtpModule } from 'src/otp/otp.module';
import { AppMailerModule } from 'src/mailer/mailer.module';
import { AccountsModule } from 'src/accounts/accounts.module';

@Module({
  imports: [
    JwtModule.register({
      secret: 'JWT_SECRET_KEY',
      signOptions: { expiresIn: '99d' },
    }),
    PassportModule,
    OtpModule,
    AppMailerModule,
    AccountsModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    CustomersService,
    StaffsService,
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AuthModule {}
