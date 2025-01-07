import { IsString, IsNotEmpty } from 'class-validator';

export class ExternalAccountDto {
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  bankCode: string;
}