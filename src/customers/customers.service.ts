import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  private readonly logger: Logger = new Logger(CustomersService.name);

  constructor(
    private readonly prismaService: PrismaService
  ) { }

  async isCustomerExist(phone: string): Promise<boolean> {
    try {
      const customer = await this.prismaService.customer.findUnique({
        where: {
          phone
        }
      })
  
      if (customer) {
        return true;
      }
  
      return false;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async createCustomer(payload: CreateCustomerDto) {
    const { phone, fullName, email, password } = payload;
    try {
      const customer = await this.prismaService.customer.create({
        data: {
          phone,
          full_name: fullName,
          email,
          password
        }
      });
  
      return customer;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }
}
