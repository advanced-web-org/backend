import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { hashData } from './pgp.utils';
import { TransactionService } from 'src/transaction/transaction.service';
import { CreateTransactionDto } from 'src/transaction/dto/create-transaction.dto';
import { BankService } from 'src/bank/bank.service';
import { RsaService } from './rsa.service';

@Injectable()
export class PartnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly bankService: BankService,
    private readonly rsaService: RsaService,
  ) {}

  async getAccountInfo(
    bankId: number,
    accountNumber: string,
    hash: string,
    signature: string,
  ) {
    const bank = await this.prisma.bank.findUnique({
      where: { bank_id: bankId },
    });
    if (!bank || !bank.public_key)
      throw new BadRequestException('Bank not registered.');

    const dataToHash = `${bankId}-${accountNumber}`;
    const expectedHash = hashData(dataToHash, bank.public_key);
    if (expectedHash !== hash) throw new BadRequestException('Hash mismatch.');
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
    encryptedData,
    integrity,
    signature,
  }: {
    encryptedData: string;
    integrity: string;
    signature: string;
  }) {
    const decryptedData = JSON.parse(this.rsaService.decrypt(encryptedData));
    const header = decryptedData.header;
    const payload = decryptedData.payload;

    if (
      !this.rsaService.isHashValid(decryptedData, integrity, header.hashMethod)
    )
      throw new BadRequestException('Integrity check failed.');

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
      status: 'success',
      message: 'Transaction successful',
      timestamp: Date.now(),
    };

    const responseData = JSON.stringify({ header, payload: responsePayload });
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

    await this.transactionService.create({
      from_bank_id: fromBank.bank_id,
      from_account_number: fromAccountNumber,
      to_bank_id: 1,
      to_account_number: toBankAccountNumber,
      transaction_type: 'transaction',
      transaction_amount: Number(amount),
      transaction_message: message,
      fee_payer: feePayer,
      fee_amount: feeAmount,
      request_signature: signature,
      response_signature: responseSignature,
    });

    return {
      data: encryptedResponse,
      integrity: responseIntegrity,
      signature: responseSignature,
    };
  }
}
