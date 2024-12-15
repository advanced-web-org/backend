import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export default class CreateDebtDto {
  @IsNumber()
  creditor_id: number;

  @IsNumber()
  debtor_id: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  debt_amount: number;

  debt_message?: string;
}