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
}

export interface GetAccountInfoBody {
  payload: {
    bankId: string;
    accountNumber: string;
    hash: string;
  };
  signature: string;
}
