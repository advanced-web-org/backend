import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { Customer } from '@prisma/client';
import { AccountsService } from 'src/accounts/accounts.service';

@Injectable()
export class CustomersService {
  private readonly logger: Logger = new Logger(CustomersService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  async isCustomerExist(phone: string): Promise<boolean> {
    try {
      const customer = await this.prismaService.customer.findUnique({
        where: {
          phone,
        },
      });

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
          password,
        },
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
          phone,
        },
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
          customer_id: id,
        },
      });

      return customer;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async updateCustomer(
    phone: string,
    payload: UpdateCustomerDto,
  ): Promise<Customer> {
    try {
      const customer = await this.prismaService.customer.update({
        where: {
          phone: phone,
        },
        data: {
          ...payload,
        },
      });

      return customer;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  create(createCustomerDto: CreateCustomerDto) {
    return 'This action adds a new customer';
  }

  findAll() {
    return `This action returns all customers`;
  }

  findAllWithAccounts() {
    return this.prismaService.customer.findMany({
      select: {
        customer_id: true,
        full_name: true,
        email: true,
        phone: true,
        accounts: {
          select: {
            account_id: true,
            account_number: true,
            account_balance: true,
          },
        },
      },
    });
  }

  async findByAccountNumber(accountNumber: string) {
    const account = await this.accountsService.findOnebyAccountNumber(
      accountNumber,
    );

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    const res = await this.prismaService.customer.findUnique({
      where: {
        customer_id: account.customer_id,
      },
      select: {
        full_name: true,
      }
    });

    return {
      fullName: res?.full_name,
      accountNumber: account.account_number,
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} customer`;
  }

  update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return `This action updates a #${id} customer`;
  }

  remove(id: number) {
    return `This action removes a #${id} customer`;
  }
}
