import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateTransactionDto,
  ExternalTransactionDto,
  InternalTransactionDto,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma, trans_type, Transaction } from '@prisma/client';
import { AccountsService } from 'src/accounts/accounts.service';
import { OtpService } from 'src/otp/otp.service';
import { AppMailerService } from 'src/mailer/mailer.service';
import { CustomersService } from 'src/customers/customers.service';
import { OtpData } from 'src/otp/types/otp-data.type';
import { HttpService } from '@nestjs/axios';
import { BankService } from 'src/bank/bank.service';
import { RsaService } from 'src/partner/rsa.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: AccountsService,
    private readonly otpService: OtpService,
    private readonly mailerService: AppMailerService,
    private readonly customerService: CustomersService,
    private readonly rsaService: RsaService,
    private readonly httpService: HttpService,
    private readonly bankService: BankService,
  ) {}

  async createInternalTransaction(
    payload: InternalTransactionDto,
  ): Promise<Transaction> {
    let isDeposit: boolean = false;

    if (payload.transaction_type == 'deposit') isDeposit = true;

    // Deposit logic
    if (isDeposit) {
      const toAccount = this.accountService.findOnebyAccountNumber(
        payload.to_account_number,
      );

      if (!(await toAccount)) {
        throw new Error('Account not found');
      }

      // Update the balance of the recipient
      const toAccountData = await toAccount;

      await this.prisma.account.update({
        where: {
          account_number: payload.to_account_number,
        },
        data: {
          account_balance: new Prisma.Decimal(
            (toAccountData?.account_balance?.toNumber() ?? 0) +
              Number(payload.transaction_amount),
          ),
        },
      });

      return await this.prisma.transaction.create({
        data: {
          ...payload,
          transaction_amount: new Prisma.Decimal(payload.transaction_amount),
          fee_amount: new Prisma.Decimal(payload.fee_amount),
        },
      });
    }

    // Normal transaction logic
    // Check if 2 account valid
    const fromAccount = this.accountService.findOnebyAccountNumber(
      payload.from_account_number ?? '',
    );

    const toAccount = this.accountService.findOnebyAccountNumber(
      payload.to_account_number,
    );

    if (!(await fromAccount) || !(await toAccount)) {
      throw new BadRequestException('Account not found');
    }

    // Check if the balance is enough
    const fromAccountData = await fromAccount;
    const toAccountData = await toAccount;

    if (
      fromAccountData?.account_balance &&
      fromAccountData.account_balance.toNumber() <
        payload.transaction_amount + payload.fee_amount
    ) {
      throw new BadRequestException('Insufficient balance');
    }

    // Update the balance
    if (payload.fee_payer === 'from') {
      await this.prisma.account.update({
        where: {
          account_number: payload.from_account_number,
        },
        data: {
          account_balance: new Prisma.Decimal(
            (fromAccountData?.account_balance?.toNumber() ?? 0) -
              payload.transaction_amount -
              payload.fee_amount,
          ),
        },
      });

      await this.prisma.account.update({
        where: {
          account_number: payload.to_account_number,
        },
        data: {
          account_balance: new Prisma.Decimal(
            (toAccountData?.account_balance?.toNumber() ?? 0) +
              payload.transaction_amount,
          ),
        },
      });
    } else {
      await this.prisma.account.update({
        where: {
          account_number: payload.from_account_number,
        },
        data: {
          account_balance: new Prisma.Decimal(
            (fromAccountData?.account_balance?.toNumber() ?? 0) -
              payload.transaction_amount,
          ),
        },
      });

      await this.prisma.account.update({
        where: {
          account_number: payload.to_account_number,
        },
        data: {
          account_balance: new Prisma.Decimal(
            (toAccountData?.account_balance?.toNumber() ?? 0) +
              payload.transaction_amount -
              payload.fee_amount,
          ),
        },
      });
    }

    return await this.prisma.transaction.create({
      data: {
        ...payload,
        transaction_amount: new Prisma.Decimal(payload.transaction_amount),
        fee_amount: new Prisma.Decimal(payload.fee_amount),
      },
    });
  }

  async createExternalTransaction(payload: ExternalTransactionDto) {
    return `This action adds a new transaction for external`;
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
      include: {
        from_bank: true,
        to_bank: true,
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
        },
      });

      const groupedBalances = transactions.reduce<{
        [key: string]: { amount: number; bankName: string };
      }>((acc, transaction) => {
        const key = [transaction.from_bank_id, transaction.to_bank_id]
          .sort()
          .join('-');
        if (!acc[key]) {
          acc[key] = { amount: 0, bankName: '' };
        }
        acc[key].amount += Number(transaction.transaction_amount);
        acc[key].bankName =
          transaction.from_bank_id === bankId
            ? transaction.to_bank?.bank_name || ''
            : transaction.from_bank?.bank_name || '';
        return acc;
      }, {});

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

  async requestOtpForTransaction(userId: number) {
    const user = await this.customerService.getCustomerById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { otp, expiresAt }: OtpData = await this.otpService.getOtpData();
    await this.mailerService.sendOtpEmail(user.email, otp);

    return {
      otpToken: await this.otpService.getOtpToken({ otp, expiresAt }, userId),
      message: `OTP sent to your email ${user.email}`,
    };
  }

  async verifyOtpForTransaction(
    userId: number,
    otp: string,
    otpToken: string,
    payload: CreateTransactionDto,
  ) {
    const user = await this.customerService.getCustomerById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // await this.otpService.verifyOtpToken(otp, otpToken, userId);

    return payload.type === 'internal'
      ? await this.createInternalTransaction(
          payload.data as InternalTransactionDto,
        )
      : await this.createExternalTransaction(
          payload.data as ExternalTransactionDto,
        );
  }

  async handleInboundTransaction(createTransactionDto: CreateTransactionDto) {
    // check if the to account exists
    const toAccount = await this.accountService.findOnebyAccountNumber(
      createTransactionDto.to_account_number,
    );

    if (!toAccount) {
      throw new Error('Destination account not found');
    }

    await this.prisma.$transaction(async (transactionalPrisma) => {
      // Update the balance
      await transactionalPrisma.account.update({
        where: {
          account_number: createTransactionDto.to_account_number,
        },
        data: {
          account_balance: {
            increment:
              createTransactionDto.transaction_amount -
              (createTransactionDto.fee_payer === 'to'
                ? createTransactionDto.fee_amount
                : 0),
          },
        },
      });

      // Create the transaction
      await transactionalPrisma.transaction.create({
        data: {
          ...createTransactionDto,
          transaction_amount: new Prisma.Decimal(
            createTransactionDto.transaction_amount,
          ),
          fee_amount: new Prisma.Decimal(createTransactionDto.fee_amount),
        },
      });
    });
  }

  // Nomeo bank
  async handleOutboundTransaction(createTransactionDto: CreateTransactionDto) {
    const bankEndpoint =
      'https://nomeobank.onrender.com/transactions/external/receive';
    const toBank = await this.bankService.findOne(
      createTransactionDto.to_bank_id,
    );
    if (!toBank) {
      throw new Error('Bank not found');
    }

    const toBankCode = toBank.bank_name;
    if (!toBankCode) {
      throw new Error('Bank code not found');
    }

    const requestPayload = {
      sender_account_number: createTransactionDto.from_account_number,
      recicpient_account_number: createTransactionDto.to_account_number,
      transaction_amount: createTransactionDto.transaction_amount,
      transaction_message: createTransactionDto.transaction_message,
      fee_payment_method:
        createTransactionDto.fee_payer === 'from' ? 'SENDER' : 'RECIPIENT',
      fee_amount: createTransactionDto.fee_amount,
    };

    const encryptedPayload = this.rsaService.encrypt(
      JSON.stringify(requestPayload),
      toBankCode,
    );

    const hashPayload = this.rsaService.hashData(
      JSON.stringify(requestPayload),
      'sha256',
    );

    const timestamp = new Date().toISOString();

    const signature = this.rsaService.createSignature(
      encryptedPayload + timestamp,
      'sha256',
    );

    const request = {
      timestamp,
      signature,
      hashPayload,
      encryptedPayload,
    };

    const response = await this.httpService
      .post(bankEndpoint, request)
      .toPromise();

    const message = response!.data.message;

    if (message !== 'Transaction created successfully') {
      throw new Error('Transaction failed');
    }

    const encryptedData = response!.data.data.encryptData;
    const responseSignature = response!.data.data.signature;
    const decryptedData = this.rsaService.decrypt(encryptedData);
    const responseData = JSON.parse(decryptedData);

    // verify the response signature
    const isVerified = this.rsaService.verifySignature(
      decryptedData,
      responseSignature,
      toBankCode,
    );

    if (!isVerified) {
      throw new Error('Invalid response signature');
    }

    createTransactionDto.request_signature = signature;
    createTransactionDto.response_signature = responseSignature;

    // check if the from account exists
    const fromAccount = await this.accountService.findOnebyAccountNumber(
      createTransactionDto.from_account_number ?? '',
    );

    if (!fromAccount) {
      throw new Error('Source account not found');
    }

    await this.prisma.$transaction(async (transactionalPrisma) => {
      // Update the balance
      await transactionalPrisma.account.update({
        where: {
          account_number: createTransactionDto.from_account_number,
        },
        data: {
          account_balance: {
            decrement:
              createTransactionDto.transaction_amount +
              (createTransactionDto.fee_payer === 'from'
                ? createTransactionDto.fee_amount
                : 0),
          },
        },
      });

      // Create the transaction
      await transactionalPrisma.transaction.create({
        data: {
          ...createTransactionDto,
          transaction_amount: new Prisma.Decimal(
            createTransactionDto.transaction_amount,
          ),
          fee_amount: new Prisma.Decimal(createTransactionDto.fee_amount),
        },
      });
    });
  }
}

// Nomeo bank request
export interface NomeoBankRequestPayload {
  timestamp: string;
  signature: string;
  hashPayload: string;
  payload: {
    sender_account_number: string;
    recicpient_account_number: string;
    transaction_amount: string;
    transaction_message: string;
    fee_payment_method: string;
  };
}
