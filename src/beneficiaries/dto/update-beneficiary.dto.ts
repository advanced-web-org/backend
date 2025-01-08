import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'Update Beneficiary DTO description' })
export class UpdateBeneficiaryDto {
  @ApiProperty({ description: 'nickname' })
  @IsString()
  nickname: string;
}
