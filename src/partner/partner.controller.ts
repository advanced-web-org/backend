import {
  Body,
  Controller,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { RsaGuard } from 'src/auth/guards/rsa.guard';
import { AccountInfoDto, AccountInfoPayloadDto } from './dto/account-info.dto';
import {
  TransactionBodyDto,
  TransactionPayloadDto,
} from './dto/inbound-transaction.dto';
import { InboundRequestDto } from './dto/request.dto';
import { PartnerService } from './partner.service';

@Controller('partner')
@UseGuards(RsaGuard)
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Post('get-account-info')
  @SetMetadata('dto', AccountInfoPayloadDto)
  async getAccountInfo(@Body() body: InboundRequestDto, @Req() req: any) {
    const decryptedPayload = req.decryptedPayload as AccountInfoPayloadDto;
    const encryptedBody: AccountInfoDto = {
      header: body.header,
      payload: decryptedPayload,
      integrity: body.integrity,
    };
    return await this.partnerService.getAccountInfo(encryptedBody);
  }

  @Post('transaction')
  @SetMetadata('dto', TransactionPayloadDto)
  async makeTransaction(@Body() body: InboundRequestDto, @Req() req: any) {
    const encryptedBody: TransactionBodyDto = {
      header: body.header,
      payload: req.decryptedPayload as TransactionPayloadDto,
      integrity: body.integrity,
      signature: body.signature,
    };
    return await this.partnerService.makeTransaction(encryptedBody);
  }
}
