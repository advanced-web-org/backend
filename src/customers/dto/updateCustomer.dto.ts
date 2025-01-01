import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UpdateCustomerDto description' })
export class UpdateCustomerDto {
  @ApiProperty({ description: 'The ID of the customer' })
  id?: number;

  @ApiProperty({ description: 'The phone number of the customer' })
  phone?: string;

  @ApiProperty({ description: 'The full name of the customer' })
  full_name?: string;

  @ApiProperty({ description: 'The email of the customer' })
  email?: string;

  @ApiProperty({ description: 'The password of the customer' })
  password?: string;

  @ApiProperty({ description: 'The refresh token of the customer' })
  refresh_token?: string;
}
