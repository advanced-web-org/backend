import { BadRequestException, Injectable } from '@nestjs/common';
import { Account, Prisma, trans_type } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { hashData } from './pgp.utils';
import { TransactionService } from 'src/transaction/transaction.service';
import { CreateTransactionDto } from 'src/transaction/dto/create-transaction.dto';
import { BankService } from 'src/bank/bank.service';
import { RsaService } from './rsa.service';
import { AccountsService } from 'src/accounts/accounts.service';

@Injectable()
export class PartnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly bankService: BankService,
    private readonly rsaService: RsaService,
    private readonly accountService: AccountsService,
  ) {}

  async getAccountInfo(
    accountNumber: string,
  ) {
    return await this.accountService.findOnebyAccountNumber(accountNumber);
  }

  // async makeTransaction(fromBankCode: string, body: CreateTransactionDto) {
  //   const fromBank = await this.bankService.getBankByName(fromBankCode);
  //   if (!fromBank) throw new BadRequestException('From bank not found.');
  //   body.from_bank_id = fromBank.bank_id;

  //   const payload = {
  //     status: 'success',
  //     message: 'Transaction successful',
  //     timestamp: Date.now(),
  //   };

  //   const header = {
  //     hashMethod: 'sha256',
  //   };

  //   const dataToHash = JSON.stringify({ header, payload });
  //   const integrity = this.rsaService.hashData(dataToHash, header.hashMethod);
  //   const signature = this.rsaService.createSignature(
  //     dataToHash,
  //     header.hashMethod,
  //   );
  //   const encryptedData = this.rsaService.encrypt(dataToHash, fromBankCode);

  //   body.response_signature = signature;

  //   await this.transactionService.create(body);

  //   return {
  //     data: encryptedData,
  //     integrity,
  //     signature,
  //   };
  // }

  async makeTransaction({
    header,
    encryptedPayload,
    integrity,
    signature,
  }: {
    header: {
      hashMethod: string;
      timestamp: string;
    }
    encryptedPayload: string;
    integrity: string;
    signature: string;
  }) {
    const bankId = process.env.BANK_ID;
    const payload = JSON.parse(this.rsaService.decrypt(encryptedPayload));

    const {
      fromBankCode,
      fromAccountNumber,
      toBankAccountNumber,
      amount,
      message,
      feePayer,
      feeAmount,
      timestamp,
    } = payload;
    const fromBank = await this.bankService.getBankByName(fromBankCode);
    if (!fromBank) throw new BadRequestException('From bank not found.');

    const responsePayload = {
      statuscode: 200,
      message: 'Transaction successful',
      timestamp: Date.now(),
    };

    const responseData = JSON.stringify(responsePayload);
    const responseIntegrity = this.rsaService.hashData(
      responseData,
      header.hashMethod,
    );
    const responseSignature = this.rsaService.createSignature(
      responseData,
      header.hashMethod,
    );
    const encryptedResponse = this.rsaService.encrypt(
      responseData,
      fromBankCode,
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
    }

    await this.transactionService.handleInboundTransaction(createBankDto);

    return {
      data: encryptedResponse,
      integrity: responseIntegrity,
      signature: responseSignature,
    };
  }
}
