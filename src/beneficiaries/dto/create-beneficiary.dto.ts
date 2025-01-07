import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

@ApiSchema({ name: 'Create Beneficiary DTO description' })
export class CreateBeneficiaryDto {
  @ApiProperty({ description: 'bank id' })
  @IsNumber()
  @IsNotEmpty()
  bank_id: number;

  @ApiProperty({ description: 'account number' })
  @IsString()
  @IsNotEmpty()
  account_number: string;

  @ApiProperty({ description: 'nickname' })
  nickname?: string;
}
