import { Body, Controller, Logger, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterCustomerDto } from './dto';
import e, { response } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register_customer')
  async registerCustomer(@Body() body: RegisterCustomerDto, @Res() response: any) {
    return this.authService.registerCustomer(body);
  }

  @Post('login')
  signin(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('me')
  me() {
    return this.authService.me();
  }
}
