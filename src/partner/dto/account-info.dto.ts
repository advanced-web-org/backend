import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { HeaderDto } from './request.dto';

class AccountInfoPayloadDto {
  @ApiProperty({ description: 'Bank code' })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({ description: 'Account number' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: 'Hash value' })
  @IsString()
  @IsNotEmpty()
  hash: string;
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

  @ApiProperty({ description: 'Signature of the request' })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
