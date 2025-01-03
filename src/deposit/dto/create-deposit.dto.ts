import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { CreateTransactionDto } from 'src/transaction/dto/create-transaction.dto';

@ApiSchema({ name: 'CreateDepositDto description' })
export class CreateDepositDto {
  @ApiProperty({ description: 'The username of the staff' })
  employee_id: number;

  @ApiProperty({ description: 'The transaction details of the deposit' })
  transaction: CreateTransactionDto;
}
