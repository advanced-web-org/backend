import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UpdateStaffDto description' })
export class UpdateStaffDto {
  @ApiProperty({ description: 'The id of the staff' })
  id?: number;

  @ApiProperty({ description: 'The role of the staff' })
  role?: string;

  @ApiProperty({ description: 'The full name of the staff' })
  full_name?: string;

  @ApiProperty({ description: 'The username of the staff' })
  username?: string;

  @ApiProperty({ description: 'The password of the staff' })
  password?: string;

  @ApiProperty({ description: 'The refresh token of the staff' })
  refresh_token?: string;
}
