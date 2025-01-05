import { ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'CreateAccountDto description' })
export class CreateAccountDto {
  customer_id: number;
  account_number: string;
  account_balance: number;
}
