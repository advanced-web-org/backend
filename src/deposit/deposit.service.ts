import { Injectable } from '@nestjs/common';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class DepositService {
  constructor(
    private prisma: PrismaService,
    private transactionService: TransactionService,
  ) {}

  async create(createDepositDto: CreateDepositDto) {
    return await this.prisma.$transaction(async (transactionPrisma) => {
      const { transaction, ...rest } = createDepositDto;

      const createdTransaction = await transactionPrisma.transaction.create({
        data: {
          ...transaction,
          transaction_amount: new Prisma.Decimal(
            transaction.transaction_amount,
          ),
          fee_amount: new Prisma.Decimal(transaction.fee_amount),
        },
      });

      return transactionPrisma.deposit.create({
        data: {
          transaction_id: createdTransaction.transaction_id,
          employee_id: rest.employee_id,
        },
      });
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
