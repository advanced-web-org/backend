import { CreateTransactionDto } from "src/transaction/dto/create-transaction.dto";

export class CreateDepositDto {
    employee_id: number;
    transaction: CreateTransactionDto;
}
