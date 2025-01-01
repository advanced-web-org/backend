import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { PartnerService } from './partner.service';

@Controller('partner')
export class PartnerController {
  constructor(
    private readonly partnerService: PartnerService,
    // private readonly accountService: AccountService
  ) { }
  
  @Post('get-account-info')
  async getAccountInfo(@Body() body: GetAccountInfoBody) {

    // return await this.partnerService.getAccountInfo(bankId, accountNumber, hash, signature);
  }

  @Post('make-transaction')
  async makeTransaction(@Body() body: MakeTransactionBody) {
    // return await this.partnerService.makeTransaction(body);
  }
}

export interface GetAccountInfoBody {
  payload: {
    bankId: string;
    accountNumber: string;
    hash: string;
  };
  signature: string;
}


export interface MakeTransactionBody {
  header: {
    hashMethod: string;
  },
  payload: {
    fromBankId: string;
    fromAccountNumber: string;
    toBankAccountNumber: string;
    amount: number;
    message: string;
    feePayer: string; // sender | receiver
    feeAmount: number;
  };
  integrity: string; // hash of the payload
  signature?: string;
}
