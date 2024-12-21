import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { Customer } from '@prisma/client';

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

  async getCustomerByPhone(phone: string): Promise<any> {
    try {
      const customer = await this.prismaService.customer.findUnique({
        where: {
          phone
        }
      });
  
      return customer;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async getCustomerById(id: number): Promise<any> {
    try {
      const customer = await this.prismaService.customer.findUnique({
        where: {
          customer_id: id
        }
      });
  
      return customer;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async updateCustomer(phone: string, payload: UpdateCustomerDto): Promise<Customer> {
    try {
      const customer = await this.prismaService.customer.update({
        where: {
          phone: phone
        },
        data: {
          ...payload
        }
      });
  
      return customer;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }
}
