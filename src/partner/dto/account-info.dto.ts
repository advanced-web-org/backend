import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { HeaderDto } from './request.dto';

export class AccountInfoPayloadDto {
  @ApiProperty({ description: 'Bank code' })
  @IsString()
  @IsNotEmpty()
  fromBankCode: string;

  @ApiProperty({ description: 'Account number' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}

export class AccountInfoDto {
  @ApiProperty({
    description: 'Header object containing hash method and timestamp',
  })
  @IsNotEmpty()
  header: HeaderDto;

  @ApiProperty({
    description: 'Payload object containing bank ID, account number, and hash',
  })
  @IsNotEmpty()
  payload: AccountInfoPayloadDto;

  @ApiProperty({ description: 'Integrity of the request' })
  @IsString()
  @IsNotEmpty()
  integrity: string;
}
