import { BadRequestException, Injectable } from '@nestjs/common';
import { trans_type } from '@prisma/client';
import { AccountsService } from 'src/accounts/accounts.service';
import { BankService } from 'src/bank/bank.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { TransactionBodyDto } from './dto/inbound-transaction.dto';
import { EncryptedResponseDto, ResponsePayloadDto } from './dto/response.dto';
import { RsaService } from './rsa.service';
import { PrismaService } from 'src/prisma.service';
import { AccountInfoDto } from './dto/account-info.dto';

@Injectable()
export class PartnerService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly bankService: BankService,
    private readonly rsaService: RsaService,
    private readonly accountService: AccountsService,
    private readonly prismaService: PrismaService,
  ) {}

  async getAccountInfo(getAccountInfoDto: AccountInfoDto) {
    const account = await this.prismaService.account.findUnique({
      where: {
        account_number: getAccountInfoDto.payload.accountNumber,
      },
      select: {
        account_id: true,
        account_number: true,
        account_balance: true,
        customer: {
          select: {
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    const responsePayload = {
      statusCode: 200,
      message: 'Account information retrieved successfully',
      data: account,
    };

    const { responseIntegrity, encryptedResponse } = this.createResponseData(
      responsePayload,
      getAccountInfoDto.header.hashMethod,
      getAccountInfoDto.payload.fromBankCode,
    );

    const response: EncryptedResponseDto = {
      encryptedPayload: encryptedResponse,
      integrity: responseIntegrity,
    };

    return response;
  }

  async makeTransaction(
    makeTransactionDto: TransactionBodyDto,
  ): Promise<EncryptedResponseDto> {
    const bankId = process.env.BANK_ID;
    const payload = makeTransactionDto.payload;
    const header = makeTransactionDto.header;
    const signature = makeTransactionDto.signature;

    const {
      fromBankCode,
      fromAccountNumber,
      toBankAccountNumber,
      amount,
      message,
      feePayer,
      feeAmount,
    } = payload;
    const fromBank = await this.bankService.getBankByName(fromBankCode);
    if (!fromBank) throw new BadRequestException('From bank not found.');

    const responsePayload: ResponsePayloadDto = {
      statusCode: 200,
      message: 'Transaction successful',
    };

    const { responseIntegrity, responseSignature, encryptedResponse } =
      this.createResponseData(
        responsePayload,
        header.hashMethod,
        fromBank.bank_name ?? '',
      );

    const createBankDto = {
      from_bank_id: fromBank.bank_id,
      from_account_number: fromAccountNumber,
      to_bank_id: Number(bankId),
      to_account_number: toBankAccountNumber,
      transaction_type: 'transaction' as trans_type,
      transaction_amount: Number(amount),
      transaction_message: message,
      fee_payer: feePayer,
      fee_amount: feeAmount,
      request_signature: signature,
      response_signature: responseSignature,
    };

    await this.transactionService.handleInboundTransaction(createBankDto);

    const response: EncryptedResponseDto = {
      encryptedPayload: encryptedResponse,
      integrity: responseIntegrity,
      signature: responseSignature,
    };

    return response;
  }

  private createResponseData(
    responsePayload: any,
    hashMethod: string,
    fromBankCode: string,
  ) {
    const responseData = JSON.stringify(responsePayload);
    const responseIntegrity = this.rsaService.hashData(
      responseData,
      hashMethod,
    );
    const responseSignature = this.rsaService.createSignature(
      responseData,
      hashMethod,
    );
    const encryptedResponse = this.rsaService.encrypt(
      responseData,
      fromBankCode,
    );

    return { responseIntegrity, responseSignature, encryptedResponse };
  }
}
