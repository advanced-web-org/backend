import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, RefreshTokenDto, RegisterCustomerDto } from './dto';
import { LocalAuthGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/user.decorator';
import { CreateStaffDto } from 'src/staffs/dto/createStaff.dto';
import { StaffsService } from 'src/staffs/staffs.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly staffService: StaffsService
  ) {}

  @Post('register_customer')
  async registerCustomer(@Body() body: RegisterCustomerDto) {
    return this.authService.registerCustomer(body);
  }

  @Post('register_staff')
  async registerStaff(@Body() body: CreateStaffDto) {
    return this.authService.registerStaff(body);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  signin(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('refresh_token')
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change_password')
  async changePassword(@Body() body: ChangePasswordDto, @CurrentUser() user: any) {
    return this.authService.changePassword(
      user.username,
      body.oldPassword,
      body.newPassword
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return this.authService.me(user.userId, user.role);
  }
}
