import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma, trans_type, Transaction } from '@prisma/client';
import { AccountsService } from 'src/accounts/accounts.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: AccountsService,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    // Check if 2 account valid
    const fromAccount = this.accountService.findOnebyAccountNumber(
      createTransactionDto.from_account_number ?? '',
    );
    const toAccount = this.accountService.findOnebyAccountNumber(
      createTransactionDto.to_account_number,
    );

    if (!(await fromAccount) || !(await toAccount)) {
      throw new Error('Account not found');
    }

    // Check if the balance is enough
    const fromAccountData = await fromAccount;

    if (
      fromAccountData?.account_balance &&
      fromAccountData.account_balance.toNumber() <
        createTransactionDto.transaction_amount +
          createTransactionDto.fee_amount
    ) {
      throw new Error('Insufficient balance');
    }

    // Update the balance
    await this.prisma.account.update({
      where: {
        account_number: createTransactionDto.from_account_number,
      },
      data: {
        account_balance: new Prisma.Decimal(
          (fromAccountData?.account_balance?.toNumber() ?? 0) -
            createTransactionDto.transaction_amount -
            createTransactionDto.fee_amount,
        ),
      },
    });

    return await this.prisma.transaction.create({
      data: {
        ...createTransactionDto,
        transaction_amount: new Prisma.Decimal(
          createTransactionDto.transaction_amount,
        ),
        fee_amount: new Prisma.Decimal(createTransactionDto.fee_amount),
      },
    });
  }

  async findAll(bankId: number, accountNumber: string) {
    const sendTransactions = await this.findSent(bankId, accountNumber);
    const receivedTransactions = await this.findReceived(bankId, accountNumber);

    return {
      sendTransactions,
      receivedTransactions,
    };
  }

  async findReceived(bankId: number, accountNumber: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        to_bank_id: bankId,
        to_account_number: accountNumber,
      },
    });

    return transactions;
  }

  async findSent(bankId: number, accountNumber: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        from_bank_id: bankId,
        from_account_number: accountNumber,
      },
    });

    return transactions;
  }

  async findDebtPaid(bankId: number, accountNumber: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        debtPayments: {
          some: {},
        },
        OR: [
          {
            from_bank_id: bankId,
            from_account_number: accountNumber,
          },
          {
            to_bank_id: bankId,
            to_account_number: accountNumber,
          },
        ],
      },
    });

    return transactions;
  }

  async findExternal(
    bankId: number,
    startDate: string,
    endDate: string,
    externalBankId: string,
  ) {
    const dateFilter: { transaction_date?: { gte?: Date; lte?: Date } } = {};
    if (startDate) {
      dateFilter['transaction_date'] = {
        ...dateFilter['transaction_date'],
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59);
      dateFilter['transaction_date'] = {
        ...dateFilter['transaction_date'],
        lte: endDateTime,
      };
    }

    const bankIdFilter = externalBankId
      ? {
          OR: [
            {
              from_bank_id: Number(externalBankId),
            },
            {
              to_bank_id: Number(externalBankId),
            },
          ],
        }
      : {};

    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...dateFilter,
        ...bankIdFilter,
        AND: [
          {
            OR: [
              {
                from_bank_id: bankId,
              },
              {
                to_bank_id: bankId,
              },
            ],
          },
          {
            NOT: {
              from_bank_id: bankId,
              to_bank_id: bankId,
            },
          },
        ],
      },
    });

    return transactions;
  }

  async findExternalBalance(bankId: number, externalBankId: string) {
    if (!externalBankId) {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          OR: [
            {
              from_bank_id: bankId,
            },
            {
              to_bank_id: bankId,
            },
          ],
          NOT: {
            from_bank_id: bankId,
            to_bank_id: bankId,
          },
        },
        include: {
          from_bank: true,
          to_bank: true,
        }
      });

      const groupedBalances = transactions.reduce<{ [key: string]: { amount: number, bankName: string } }>(
        (acc, transaction) => {
          const key = [transaction.from_bank_id, transaction.to_bank_id]
            .sort()
            .join('-');
          if (!acc[key]) {
            acc[key] = { amount: 0, bankName: '' };
          }
          acc[key].amount += Number(transaction.transaction_amount);
          acc[key].bankName = transaction.from_bank_id === bankId ? transaction.to_bank?.bank_name || '' : transaction.from_bank?.bank_name || '';
          return acc;
        },
        {},
      );

      return Object.keys(groupedBalances).map((key) => {
        const [fromBankId, toBankId] = key.split('-').map(Number);
        return {
          bankId: fromBankId === bankId ? toBankId : fromBankId,
          bankName: groupedBalances[key].bankName,
          totalBalance: groupedBalances[key].amount,
        };
      });
    } else {
      const totalBalance = await this.prisma.transaction.aggregate({
        _sum: {
          transaction_amount: true,
        },
        where: {
          OR: [
            {
              from_bank_id: bankId,
              to_bank_id: Number(externalBankId),
            },
            {
              from_bank_id: Number(externalBankId),
              to_bank_id: bankId,
            },
          ],
        },
      });

      const bank = await this.prisma.bank.findUnique({
        where: {
          bank_id: Number(externalBankId),
        },
      });

      return {
        bankId: Number(externalBankId),
        bankName: bank?.bank_name,
        totalBalance: totalBalance._sum.transaction_amount,
      };
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
