import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { trans_type } from '@prisma/client';

@ApiSchema({ name: 'CreateTransactionDto description' })
export class CreateTransactionDto {
  @ApiProperty({ description: 'The bank id of the sender' })
  from_bank_id: number;

  @ApiProperty({ description: 'The bank account number of the sender' })
  from_account_number?: string;

  @ApiProperty({ description: 'The bank id of the receiver' })
  to_bank_id: number;

  @ApiProperty({ description: 'The bank account number of the receiver' })
  to_account_number: string;

  @ApiProperty({
    description: 'The transaction type',
    enum: ['deposit', 'transaction'],
  })
  transaction_type: trans_type;

  @ApiProperty({ description: 'The amount of the transaction' })
  transaction_amount: number;

  @ApiProperty({ description: 'The message of the transaction' })
  transaction_message: string;

  @ApiProperty({
    description: 'The fee payer of the transaction',
    enum: ['from', 'to'],
  })
  fee_payer?: string;

  @ApiProperty({ description: 'The fee amount of the transaction' })
  fee_amount: number;

  @ApiProperty({ description: 'The e sign of the transaction' })
  e_signal?: string;
}
