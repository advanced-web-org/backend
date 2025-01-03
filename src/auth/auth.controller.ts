import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateStaffDto } from 'src/staffs/dto/createStaff.dto';
import { StaffsService } from 'src/staffs/staffs.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/user.decorator';
import {
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterCustomerDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly staffService: StaffsService,
  ) {}

  @ApiOperation({ summary: 'Register a customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer registered successfully',
    schema: {
      example: {
        message: 'Customer registered successfully',
        data: {
          phone: '1234567890',
          fullName: 'John Doe',
          email: 'john.doe@example.com',
        },
      },
    },
  })
  @Post('register_customer')
  async registerCustomer(@Body() body: RegisterCustomerDto) {
    return this.authService.registerCustomer(body);
  }

  @ApiOperation({ summary: 'Register a staff' })
  @Post('register_staff')
  async registerStaff(@Body() body: CreateStaffDto) {
    return this.authService.registerStaff(body);
  }

  @ApiOperation({ summary: 'Login' })
  @Post('login')
  signin(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @ApiOperation({ summary: 'Refresh a new access token' })
  @Post('refresh_token')
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body);
  }

  @ApiOperation({ summary: 'Change password' })
  @UseGuards(JwtAuthGuard)
  @Post('change_password')
  async changePassword(
    @Body() body: ChangePasswordDto,
    @CurrentUser() user: any,
  ) {
    return this.authService.changePassword(
      user.username,
      body.oldPassword,
      body.newPassword,
    );
  }

  @ApiOperation({ summary: 'Get current user' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    // Parse userId to number
    user.userId = parseInt(user.userId);

    return this.authService.me(user.userId, user.role);
  }

  @Post('forgot_password/request_otp')
  async requestOtp(@Body() body: { phone: string }) {
    return this.authService.requestOtpForPasswordReset(body.phone);
  }

  @Post('forgot_password/verify_otp')
  async verifyOtp(@Body() body: { username: string, otp: string, otpToken: string }) {
    return this.authService.verifyOtpForPasswordReset(body.username, body.otp, body.otpToken);
  }

  @Post('forgot_password/reset_password')
  async resetPassword(@Body() body: { username: string, newPassword: string }) {
    return this.authService.resetPassword(body.username, body.newPassword);
  }
}
