import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { HeaderDto } from './request.dto';

class TransactionPayloadDto {
  @ApiProperty({ description: 'Bank code (assumed to be the bank name in the database)' })
  @IsString()
  @IsNotEmpty()
  fromBankCode: string;

  @ApiProperty({ description: 'From account number' })
  @IsString()
  @IsNotEmpty()
  fromAccountNumber: string;

  @ApiProperty({ description: 'To bank account number' })
  @IsString()
  @IsNotEmpty()
  toBankAccountNumber: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Transaction message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Fee payer (sender or receiver)' })
  @IsString()
  @IsNotEmpty()
  feePayer: string;

  @ApiProperty({ description: 'Fee amount' })
  @IsNumber()
  @IsNotEmpty()
  feeAmount: number;
}

export class MakeTransactionBody {
  @ApiProperty({ description: 'Header object containing hash method and timestamp' })
  @IsNotEmpty()
  header: HeaderDto;

  @ApiProperty({ description: 'Payload object containing transaction details' })
  @IsNotEmpty()
  payload: TransactionPayloadDto;

  @ApiProperty({ description: 'Integrity check value (hash of the payload)' })
  @IsString()
  @IsNotEmpty()
  integrity: string;

  @ApiProperty({ description: 'Signature of the request', required: false })
  @IsString()
  signature?: string;
}