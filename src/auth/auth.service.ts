import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto, RefreshTokenDto, RegisterCustomerDto } from './dto';
import { CustomersService } from 'src/customers/customers.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './interfaces';
import { v4 as uuidv4 } from 'uuid';

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

  async validateCustomer(payload: LoginDto) {
    const { username, password } = payload;

    const customer = await this.customersService.getCustomerByPhone(username);
    if (!customer) {
      throw new UnauthorizedException('The username or password is incorrect');
    }

    const isPasswordMatch = await this.comparePassword(password, customer.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('The username or password is incorrect');
    }

    return {
      phone: customer.phone,
      fullName: customer.full_name,
      email: customer.email
    }
  }

  async login(payload: LoginDto) {
    const { username } = payload;
    const customer = await this.customersService.getCustomerByPhone(username);

    const tokenPayload: TokenPayload = {
      phone: customer.phone
    };

    const token = await this.generateToken(tokenPayload);

    await this.updateRefreshToken(customer.phone, token.refreshToken);

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

  async generateToken(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        payload,
        {
          secret: 'JWT_SECRET_KEY',
          expiresIn: '1h'
        }
      ),
      uuidv4()
    ])
    return {
      accessToken,
      refreshToken
    }
  }

  async refreshToken(payload: RefreshTokenDto) {
    const { username, refreshToken } = payload;
    const customer = await this.customersService.getCustomerByPhone(username);

    if (customer.refresh_token != refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenPayload: TokenPayload = {
      phone: customer.phone
    };

    const token = await this.generateToken(tokenPayload);

    await this.updateRefreshToken(customer.phone, token.refreshToken);

    return {
      message: 'Refresh token successfully',
      data: {
        phone: customer.phone,
        fullName: customer.full_name,
        email: customer.email,
        ...token
      }
    }
  }

  async updateRefreshToken(phone: string, refreshToken: string) {
    await this.customersService.updateCustomer(phone, { refresh_token: refreshToken });
  }
}
