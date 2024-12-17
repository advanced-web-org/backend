import { Injectable } from '@nestjs/common';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BeneficiariesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createBeneficiaryDto: CreateBeneficiaryDto) {
    return 'This action adds a new beneficiary';
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

  remove(id: number) {
    return `This action removes a #${id} beneficiary`;
  }
}
