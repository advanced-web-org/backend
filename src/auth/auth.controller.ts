import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: any) {
    return this.authService.signup(body);
  }

  @Post('signin')
  signin(@Body() body: any) {
    return this.authService.signin(body);
  }

  @Get('me')
  me() {
    return this.authService.me();
  }
}
