import { Injectable } from '@nestjs/common';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BankService {
  constructor(private prisma: PrismaService) {}

  create(createBankDto: CreateBankDto) {
    return 'This action adds a new bank';
  }

  async findAll(bankId: number) {
    return await this.prisma.bank.findMany({
      where: {
        NOT: {
          bank_id: bankId,
        },
      }
    });
  }

  async findOne(bank_id: number) {
    return await this.prisma.bank.findUnique({
      where: {
        bank_id: bank_id,
      }
    });
  }

  update(id: number, updateBankDto: UpdateBankDto) {
    return `This action updates a #${id} bank`;
  }

  remove(id: number) {
    return `This action removes a #${id} bank`;
  }
}
