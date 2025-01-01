import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

@ApiSchema({ name: 'CreateDebtDto description' })
export default class CreateDebtDto {
  @ApiProperty({ description: 'The creditor id' })
  @IsNumber()
  creditor_id: number;

  @ApiProperty({ description: 'The debtor id' })
  @IsNumber()
  debtor_id: number;

  @ApiProperty({ description: 'The debt amount' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  debt_amount: number;

  @ApiProperty({ description: 'The debt message' })
  debt_message?: string;
}
