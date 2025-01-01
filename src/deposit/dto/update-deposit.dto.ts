import { PartialType } from '@nestjs/mapped-types';
import { CreateDepositDto } from './create-deposit.dto';
import { ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UpdateDepositDto description' })
export class UpdateDepositDto extends PartialType(CreateDepositDto) {}
