import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'InitiatePaymentDto description' })
export class InitiatePaymentDto {
  @ApiProperty({ description: 'The debt id' })
  debt_id: number;
}
