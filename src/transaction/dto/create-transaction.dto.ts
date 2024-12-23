import { trans_type } from '@prisma/client';

export class CreateTransactionDto {
  from_bank_id: number;
  from_account_number?: string;
  to_bank_id: number;
  to_account_number: string;
  transaction_type: trans_type;
  transaction_amount: number;
  transaction_message: string;
  fee_payer?: string;
  fee_amount: number;
  e_signal?: string;
}
