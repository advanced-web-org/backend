import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { PrismaService } from 'src/prisma.service';
import { CustomersService } from 'src/customers/customers.service';
import { Beneficiary } from '@prisma/client';

@Injectable()
export class BeneficiariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerService: CustomersService,
  ) {}

  async create(
    customerId: number,
    bank_id: number,
    account_number: string,
    nickname?: string,
  ) {
    try {
      if (!nickname) {
        nickname = await this.customerService.getCustomerByAccountNumber(account_number).then((customer) => customer.full_name)
      }
  
      const bene = await this.prisma.beneficiary.create({
        data: {
          account_number,
          nickname,
          bank_id,
          customer_id: customerId,
        },
      });
      return bene;
    } catch (error) {
      throw new BadRequestException(`Could not create beneficiary ${error.message}`);
    }
  }

  async findAll(customerID: number) {
    const beneficiaries = await this.prisma.beneficiary.findMany({
      where: {
        customer_id: customerID,
      },
      select: {
        beneficiary_id: true,
        account_number: true,
        nickname: true,
        bank: {
          select: {
            bank_name: true,
          },
        },
      },
    });

    return beneficiaries;
  }

  findOne(id: number) {
    return `This action returns a #${id} beneficiary`;
  }

  update(id: number, updateBeneficiaryDto: UpdateBeneficiaryDto) {
    return `This action updates a #${id} beneficiary`;
  }

  async remove(beneficiary_id: number): Promise<Beneficiary> {
    try {
      const beneficiary = await this.prisma.beneficiary.findFirst({
        where: {
          beneficiary_id,
        },
      });

      if (!beneficiary) {
        throw new BadRequestException('Beneficiary not found');
      }

      await this.prisma.beneficiary.deleteMany({
        where: {
          beneficiary_id,
        }
      })

      return beneficiary;
    } catch (error) {
      throw new Error(error?.message || 'Something went wrong');
    }
  }
}
