import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RegisterCustomerDto } from './dto';
import { CustomersService } from 'src/customers/customers.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly customersService: CustomersService
  ) { }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async registerCustomer(payload: RegisterCustomerDto) {
    const { phone, fullName, email, password } = payload;
    try {
      const isCustomerExist = await this.customersService.isCustomerExist(phone);
      if (isCustomerExist) {
        throw new Error('Phone number already registered');
      }
  
      const hashedPassword = await this.hashPassword(password);
  
      const customer = await this.customersService.createCustomer({
        phone,
        fullName,
        email,
        password: hashedPassword
      });

      if (!customer) {
        throw new Error('Failed to register customer');
      }

      return {
        message: 'Customer registered successfully',
        data: {
          phone: customer.phone,
          fullName: customer.full_name,
          email: customer.email
        }
      }
    } catch (error) {
      throw new Error(error?.message || 'Something went wrong');
    }
  }
}
