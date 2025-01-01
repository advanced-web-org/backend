import { PartialType } from '@nestjs/mapped-types';
import { CreateBankDto } from './create-bank.dto';
import { ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UpdateBankDto description' })
export class UpdateBankDto extends PartialType(CreateBankDto) {}
