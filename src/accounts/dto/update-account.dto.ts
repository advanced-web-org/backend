import { ApiSchema, PartialType } from '@nestjs/swagger';
import { CreateAccountDto } from './create-account.dto';


@ApiSchema({ name: 'UpdateAccountDto description' })
export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
