import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RsaGuard } from 'src/auth/guards/rsa.guard';
import { PartnerService } from './partner.service';
import { AccountInfoDto } from './dto/account-info.dto';

@Controller('partner')
@UseGuards(RsaGuard)
export class PartnerController {
  constructor(
    private readonly partnerService: PartnerService,
  ) { }
  
  @Post('get-account-info')
  async getAccountInfo(@Body() body: AccountInfoDto) {
    return await this.partnerService.getAccountInfo(body.payload.accountNumber);
  }

  @Post('transaction')
  async makeTransaction(@Body() body: {
    header: {
      hashMethod: string,
      timestamp: string,
    },
    encryptedPayload: string,
    integrity: string,
    signature: string,
  }) {
    return await this.partnerService.makeTransaction({
      header: body.header,
      encryptedPayload: body.encryptedPayload,
      integrity: body.integrity,
      signature: body.signature,
    })
  }
}
