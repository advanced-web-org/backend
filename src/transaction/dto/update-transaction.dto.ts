import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';
import { ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UpdateTransactionDto description' })
export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}
