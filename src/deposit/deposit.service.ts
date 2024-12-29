import { Injectable } from '@nestjs/common';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class DepositService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
  ) {}

  async create(createDepositDto: CreateDepositDto) {
    // Create a transaction
    const transaction = this.transactionService.create(
      createDepositDto.transaction,
    );

    // Create a deposit
    return await this.prisma.deposit.create({
      data: {
        transaction_id: (await transaction).transaction_id,
        employee_id: createDepositDto.employee_id,
      },
    });
  }

  findAll() {
    return `This action returns all deposit`;
  }

  findOne(id: number) {
    return `This action returns a #${id} deposit`;
  }

  update(id: number, updateDepositDto: UpdateDepositDto) {
    return `This action updates a #${id} deposit`;
  }

  remove(id: number) {
    return `This action removes a #${id} deposit`;
  }
}
