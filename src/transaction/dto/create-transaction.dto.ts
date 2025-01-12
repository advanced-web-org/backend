import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { trans_type } from '@prisma/client';

@ApiSchema({ name: 'CreateTransactionDto description' })
export class InternalTransactionDto {
  @ApiProperty({ example: 1, description: 'The bank id of the sender' })
  from_bank_id: number;

  @ApiProperty({
    example: '20334',
    description: 'The bank account number of the sender',
  })
  from_account_number?: string;

  @ApiProperty({ example: 1, description: 'The bank id of the receiver' })
  to_bank_id: number;

  @ApiProperty({
    example: '103849',
    description: 'The bank account number of the receiver',
  })
  to_account_number: string;

  @ApiProperty({
    description: 'The transaction type',
    enum: ['deposit', 'transaction'],
  })
  transaction_type: trans_type;

  @ApiProperty({ example: 1020, description: 'The amount of the transaction' })
  transaction_amount: number;

  @ApiProperty({
    example: 'car payment',
    description: 'The message of the transaction',
  })
  transaction_message: string;

  @ApiProperty({
    description: 'The fee payer of the transaction',
    enum: ['from', 'to'],
  })
  fee_payer?: string;

  @ApiProperty({ example: 1, description: 'The fee amount of the transaction' })
  fee_amount: number;

  @ApiProperty({ description: 'The request signature of the transaction' })
  request_signature?: string;

  @ApiProperty({ description: 'The response signature of the transaction' })
  response_signature?: string;
}

// Nomeo bank
export class ExternalTransactionDto {
  bank_code: string;
  sender_account_number: string;
  recipient_account_number: string;
  transaction_amount: string;
  transaction_message: string;
  fee_payment_method: string;
  fee_amount: string;
  timestamp: string;
}

export class CreateTransactionDto {
  type: 'internal' | 'external';
  data: InternalTransactionDto | ExternalTransactionDto;
}
