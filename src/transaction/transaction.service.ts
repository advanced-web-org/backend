import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Account, Bank, Prisma, Transaction } from '@prisma/client';
import { AccountsService } from 'src/accounts/accounts.service';
import { BankService } from 'src/bank/bank.service';
import { CustomersService } from 'src/customers/customers.service';
import { AppMailerService } from 'src/mailer/mailer.service';
import { OtpService } from 'src/otp/otp.service';
import { OtpData } from 'src/otp/types/otp-data.type';
import { RsaService } from 'src/partner/rsa.service';
import { PrismaService } from 'src/prisma.service';
import {
  CreateTransactionDto,
  ExternalTransactionDto,
  InternalTransactionDto,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AxiosError } from 'axios';

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

  findDeposit(bankId: number, accountNumber: string): any {
    return this.prisma.transaction.findMany({
      where: {
        to_account_number: accountNumber,
        transaction_type: 'deposit',
      },
    });
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

  async findExternalBalance(bankId: number, externalBankId?: string) {
    return externalBankId
      ? await this.getBalanceForSpecificBank(bankId, Number(externalBankId))
      : await this.getBalancesForAllBanks(bankId);
  }

  private async getBalancesForAllBanks(bankId: number) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [{ from_bank_id: bankId }, { to_bank_id: bankId }],
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
  }

  private async getBalanceForSpecificBank(
    bankId: number,
    externalBankId: number,
  ) {
    const totalBalance = await this.prisma.transaction.aggregate({
      _sum: {
        transaction_amount: true,
      },
      where: {
        OR: [
          { from_bank_id: bankId, to_bank_id: externalBankId },
          { from_bank_id: externalBankId, to_bank_id: bankId },
        ],
      },
    });

    const bank = await this.prisma.bank.findUnique({
      where: { bank_id: externalBankId },
    });

    return {
      bankId: externalBankId,
      bankName: bank?.bank_name || '',
      totalBalance: totalBalance._sum.transaction_amount || 0,
    };
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

    await this.otpService.verifyOtpToken(otp, otpToken, userId);

    return payload.type === 'internal'
      ? await this.createInternalTransaction(
          payload.data as InternalTransactionDto,
        )
      : await this.makeOutboundTransaction(
          payload.data as InternalTransactionDto,
        );
  }

  async handleInboundTransaction(
    internalTransactionPayload: InternalTransactionDto,
  ) {
    // check if the to account exists
    await this.findAccount(
      internalTransactionPayload.to_account_number,
      'Destination account not found',
    );

    await this.processTransaction(internalTransactionPayload, [
      {
        accountNumber: internalTransactionPayload.to_account_number,
        balanceUpdate:
          internalTransactionPayload.transaction_amount -
          (internalTransactionPayload.fee_payer === 'to'
            ? internalTransactionPayload.fee_amount
            : 0),
      },
    ]);
  }

  // Nomeo bank
  async makeOutboundTransaction(
    internalTransactionPayload: InternalTransactionDto,
  ) {
    const fromBank = await this.getBankById(Number(process.env.BANK_ID));
    const toBank = await this.getBankById(
      internalTransactionPayload.to_bank_id,
    );

    const requestPayload = this.buildRequestPayload(
      internalTransactionPayload,
      fromBank.bank_name ?? '',
    );

    const { encryptedPayload, hashedPayload, signature } =
      this.createSecureRequest(requestPayload, toBank.bank_name ?? '');

    const response = await this.sendRequestToBank(
      'https://nomeobank.onrender.com/transactions/external/receive',
      { encryptedPayload, hashedPayload, signature },
    );

    const responseData = this.processBankResponse(
      response,
      toBank.bank_name ?? '',
    );

    internalTransactionPayload.request_signature = signature;
    internalTransactionPayload.response_signature =
      responseData.responseSignature;

    await this.findAccount(
      internalTransactionPayload.from_account_number ?? '',
      'Sender account not found',
    );

    await this.processTransaction(internalTransactionPayload, [
      {
        accountNumber: internalTransactionPayload.from_account_number!,
        balanceUpdate:
          internalTransactionPayload.transaction_amount -
          (internalTransactionPayload.fee_payer === 'to'
            ? internalTransactionPayload.fee_amount
            : 0),
      },
    ]);
  }

  private async getBankById(bankId: number): Promise<Bank> {
    const bank = await this.bankService.findOne(bankId);
    if (!bank) {
      throw new Error('Bank not found');
    }
    if (!bank.bank_name) {
      throw new Error('Bank code not found');
    }
    return bank;
  }

  private buildRequestPayload(
    internalTransactionPayload: InternalTransactionDto,
    bankCode: string,
  ): ExternalTransactionDto {
    return {
      bank_code: bankCode,
      sender_account_number:
        internalTransactionPayload.from_account_number ?? '',
      recipient_account_number: internalTransactionPayload.to_account_number,
      transaction_amount:
        internalTransactionPayload.transaction_amount.toString(),
      transaction_message: internalTransactionPayload.transaction_message,
      fee_payment_method:
        internalTransactionPayload.fee_payer === 'from'
          ? 'SENDER'
          : 'RECIPIENT',
      fee_amount: internalTransactionPayload.fee_amount.toString(),
      // current milliseconds
      timestamp: new Date().getTime().toString(),
    };
  }

  private createSecureRequest(
    requestPayload: ExternalTransactionDto,
    toBankCode: string,
  ) {
    const encryptedPayload = this.rsaService.encrypt(
      JSON.stringify(requestPayload),
      toBankCode,
    );
    const hashedPayload = this.rsaService.hashData(encryptedPayload, 'sha256');
    const signature = this.rsaService.createSignature(
      encryptedPayload,
      'sha256',
    );

    return { encryptedPayload, hashedPayload, signature };
  }

  private async sendRequestToBank(endpoint: string, request: object) {
    try {
      const response = await this.httpService
        .post(endpoint, request)
        .toPromise();
      if (response?.data.message !== 'Transaction created successfully') {
        throw new Error('Transaction failed');
      }
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send request to bank: ${error.message}`);
    }
  }

  private processBankResponse(response: any, toBankCode: string) {
    const encryptedData = response.data.encryptedPayload;
    const responseSignature = response.data.signature;
    const decryptedData = this.rsaService.decrypt(encryptedData);
    const isVerified = this.rsaService.verifySignature(
      encryptedData,
      responseSignature,
      toBankCode,
    );

    if (!isVerified) {
      throw new Error('Invalid response signature');
    }

    return { decryptedData: JSON.parse(decryptedData), responseSignature };
  }

  private async findAccount(
    accountNumber: string,
    errorMessage: string,
  ): Promise<Account> {
    const account =
      await this.accountService.findOnebyAccountNumber(accountNumber);
    if (!account) {
      throw new Error(errorMessage);
    }
    return account;
  }

  private async processTransaction(
    payload: InternalTransactionDto,
    balanceUpdates: { accountNumber: string; balanceUpdate: number }[],
  ) {
    await this.prisma.$transaction(async (transactionalPrisma) => {
      for (const update of balanceUpdates) {
        console.log('UPDATE: ', update);
        await transactionalPrisma.account.update({
          where: { account_number: update.accountNumber },
          data: {
            account_balance: {
              increment: update.balanceUpdate,
            },
          },
        });
      }

      await transactionalPrisma.transaction.create({
        data: {
          ...payload,
          transaction_amount: new Prisma.Decimal(payload.transaction_amount),
          fee_amount: new Prisma.Decimal(payload.fee_amount),
        },
      });
    });
  }
}
