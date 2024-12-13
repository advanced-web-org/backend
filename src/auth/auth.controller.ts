import { Body, Controller, Logger, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterCustomerDto } from './dto';
import { response } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register_customer')
  async registerCustomer(@Body() body: RegisterCustomerDto, @Res() response: any) {
    try {
      return await this.authService.registerCustomer(body);
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  @Post('signin')
  signin(@Body() body: any) {
    // return this.authService.signin(body);
  }

  @Get('me')
  me() {
    return this.authService.me();
  }
}
