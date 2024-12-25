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
import { AccountsService } from 'src/accounts/accounts.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'JWT_SECRET_KEY',
      signOptions: { expiresIn: '99d' },
    }),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    CustomersService,
    StaffsService,
    LocalStrategy,
    JwtStrategy,
    AccountsService,
  ],
})
export class AuthModule {}
