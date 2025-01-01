import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RsaGuard } from 'src/auth/guards/rsa.guard';
import { PartnerService } from './partner.service';

@Controller('partner')
@UseGuards(RsaGuard)
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
  async makeTransaction(@Body() body: {
    data: string,
    integrity: string,
    signature: string,
  }) {
    return await this.partnerService.makeTransaction({
      encryptedData: body.data,
      integrity: body.integrity,
      signature: body.signature,
    })
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
    fromBankCode: string; // assume that the bank code is bank name in database
    fromAccountNumber: string;
    toBankAccountNumber: string;
    amount: number;
    message: string;
    feePayer: string; // sender | receiver
    feeAmount: number;
    timestamp: string;
  };
  integrity: string; // hash of the payload: sha256(payload + header + secret key)
  signature?: string; // encrypted hash of the integrity: rsa/pgp(integrity, private key)
}