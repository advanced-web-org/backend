import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CustomersService } from 'src/customers/customers.service';
import { CreateStaffDto } from 'src/staffs/dto/createStaff.dto';
import { StaffsService } from 'src/staffs/staffs.service';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto, RefreshTokenDto, RegisterCustomerDto } from './dto';
import { IUser, Role, TokenPayload } from './interfaces';
import { OtpService } from 'src/otp/otp.service';
import { OtpData } from 'src/otp/types/otp-data.type';
import { AppMailerService } from 'src/mailer/mailer.service';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly customersService: CustomersService,
    private readonly staffsService: StaffsService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly mailerService: AppMailerService,
  ) {}

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
      password: hashedPassword,
    });

    if (!customer) {
      throw new BadRequestException('Failed to register customer');
    }

    return {
      message: 'Customer registered successfully',
      data: {
        phone: customer.phone,
        fullName: customer.full_name,
        email: customer.email,
      },
    };
  }

  async registerStaff(payload: CreateStaffDto) {
    const { username, fullName, password, role } = payload;
    const isStaffExist = await this.staffsService.getStaffByUserName(username);
    if (isStaffExist) {
      throw new BadRequestException('Username already registered');
    }

    const hashedPassword = await this.hashPassword(password);

    const staff = await this.staffsService.createStaff({
      username,
      fullName,
      password: hashedPassword,
      role,
    });

    if (!staff) {
      throw new BadRequestException('Failed to register staff');
    }

    return {
      message: 'Staff registered successfully',
      data: {
        username: staff.username,
        fullName: staff.full_name,
      },
    };
  }

  async validateUser(payload: LoginDto) {
    const { username, password } = payload;

    let user: any;

    if (username.includes('staff')) {
      user = await this.staffsService.getStaffByUserName(username);
    } else {
      user = await this.customersService.getCustomerByPhone(username);
    }

    if (!user) {
      throw new UnauthorizedException('The username or password is incorrect');
    }

    const isPasswordMatch = await this.comparePassword(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('The username or password is incorrect');
    }

    return {
      username: user.phone || user.username,
      fullName: user.full_name,
      email: user.email,
    };
  }

  async login(payload: LoginDto) {
    const { username } = payload;
    let user: IUser;
    if (username.includes('staff')) {
      const res = await this.staffsService.getStaffByUserName(username);

      if (!res) {
        throw new UnauthorizedException('The username is incorrect');
      }

      user = {
        id: res.staff_id.toString(),
        username: res.username? res.username : '',
        fullName: res.full_name? res.full_name : '',
        role: res.role == 'admin' ? Role.ADMIN : Role.EMPLOYEE,
      };
    } else {
      const res = await this.customersService.getCustomerByPhone(username);

      user = {
        id: res.customer_id,
        username: res.phone,
        email: res.email,
        fullName: res.full_name,
        role: Role.CUSTOMER,
      };
    }

    const token = await this.generateToken(user);

    await this.updateRefreshToken(username, token.refreshToken);

    return {
      message: 'Login successfully',
      data: {
        id: user.id,
        role: user.role,
        fullname: user.fullName,
        email: user.email,
        username: user.username,
        ...token,
      },
    };
  }

  async generateToken(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload },
        {
          secret: 'JWT_SECRET_KEY',
          expiresIn: '1h',
        },
      ),
      uuidv4(),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(payload: RefreshTokenDto) {
    const { username, refreshToken } = payload;

    let user: IUser;
    let userRefreshToken: string;
    if (username.includes('staff')) {
      const res = await this.staffsService.getStaffByUserName(username);

      if (!res) {
        throw new UnauthorizedException('User not found');
      }
      userRefreshToken = res.refresh_token ?? '';
      user = {
        id: res.staff_id.toString(),
        username: res.username? res.username : '',
        fullName: res.full_name? res.full_name : '',
        role: res.role == 'admin' ? Role.ADMIN : Role.EMPLOYEE,
      };
    } else {
      const res = await this.customersService.getCustomerByPhone(username);
      userRefreshToken = res.refresh_token;
      user = {
        id: res.customer_id,
        username: res.phone,
        email: res.email,
        fullName: res.full_name,
        role: Role.CUSTOMER,
      };
    }

    if (userRefreshToken != refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenPayload: IUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    const token = await this.generateToken(tokenPayload);

    await this.updateRefreshToken(user.username, token.refreshToken);

    return {
      message: 'Refresh token successfully',
      data: {
        role: user.role,
        fullname: user.fullName,
        email: user.email,
        username: user.username,
        ...token,
      },
    };
  }

  async updateRefreshToken(username: string, refreshToken: string) {
    if (username.includes('staff')) {
      await this.staffsService.updateStaff(username, {
        refresh_token: refreshToken,
      });
    } else {
      await this.customersService.updateCustomer(username, {
        refresh_token: refreshToken,
      });
    }
  }

  async changePassword(
    username: string,
    oldPassword: string,
    newPassword: string,
  ) {
    let user: any;
    if (username.includes('staff')) {
      user = await this.staffsService.getStaffByUserName(username);
    } else {
      user = await this.customersService.getCustomerByPhone(username);
    }

    if (!user) {
      throw new UnauthorizedException('The username is incorrect');
    }

    const isPasswordMatch = await this.comparePassword(
      oldPassword,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedException('The old password is incorrect');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    if (username.includes('staff')) {
      await this.staffsService.updateStaff(username, {
        password: hashedPassword,
      });
    } else {
      await this.customersService.updateCustomer(username, {
        password: hashedPassword,
      });
    }

    return {
      message: 'Password changed successfully',
    };
  }

  async me(userId: number, role: string) {
    let user: any;
    if (role == 'admin' || role == 'employee') {
      user = await this.staffsService.getStaffById(userId);
    } else {
      user = await this.customersService.getCustomerById(userId);
      user.account_number = '18948714';
      user.account_balance = 1000000;
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      message: 'User found',
      data: {
        id: user.customer_id || user.staff_id,
        role: user.role,
        fullname: user.full_name,
        email: user.email,
        username: user.phone || user.username,
        account_number: user.account_number ?? null,
        account_balance: user.account_balance ?? null,
      },
    };
  }

  async requestOtpForPasswordReset(username: string) {
    const user = await this.customersService.getCustomerByPhone(username)

    if (!user) {
      throw new BadRequestException('Username not found');
    };

    const { otp, expiresAt }: OtpData = await this.otpService.getOtpData();
    await this.mailerService.sendOtpEmail(user.email, otp);

    return {
      otpToken: await this.otpService.getOtpToken({otp, expiresAt}, user.customer_id),
      message: `OTP sent to your email ${user.email}`
    }
  }

  async verifyOtpForPasswordReset(username: string, otp: string, otpToken: string) {
    const user = await this.customersService.getCustomerByPhone(username);

    if (!user) {
      throw new BadRequestException('Username not found');
    }

    await this.otpService.verifyOtpToken(otp, otpToken, user.customer_id);

    return {
      status: 'success',
      message: 'OTP verified successfully'
    }
  }

  async resetPassword(username: string, newPassword: string) {
    const user = await this.customersService.getCustomerByPhone(username);
    if (!user) {
      throw new BadRequestException('Username not found');
    }
    
    const hashedPassword = await this.hashPassword(newPassword);
    await this.customersService.updateCustomer(username, { password: hashedPassword });

    return {
      status: 'success',
      message: 'Password reset successfully'
    }
  }
}
