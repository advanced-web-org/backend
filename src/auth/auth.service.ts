import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto, RegisterCustomerDto } from './dto';
import { CustomersService } from 'src/customers/customers.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly customersService: CustomersService,
    private readonly jwtService: JwtService
  ) { }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async registerCustomer(payload: RegisterCustomerDto) {
    const { phone, fullName, email, password } = payload;
    const isCustomerExist = await this.customersService.isCustomerExist(phone);
    if (isCustomerExist) {
      throw new BadRequestException('Phone number already registered');
    }

    const hashedPassword = await this.hashPassword(password);

    const customer = await this.customersService.createCustomer({
      phone,
      fullName,
      email,
      password: hashedPassword
    });

    if (!customer) {
      throw new BadRequestException('Failed to register customer');
    }

    return {
      message: 'Customer registered successfully',
      data: {
        phone: customer.phone,
        fullName: customer.full_name,
        email: customer.email
      }
    }
  }

  async login(payload: LoginDto) {
    const { username, password } = payload;

    const customer = await this.customersService.getCustomerByPhone(username);
    if (!customer) {
      throw new UnauthorizedException('The username or password is incorrect');
    }

    const isPasswordMatch = await this.comparePassword(password, customer.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('The username or password is incorrect');
    }

    const token = await this.generateToken({ phone: customer.phone });

    return {
      message: 'Login successfully',
      data: {
        phone: customer.phone,
        fullName: customer.full_name,
        email: customer.email,
        ...token
      }
    }
  }

  async generateToken(payload: any) {
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    return {
      accessToken
    }
  }
}
