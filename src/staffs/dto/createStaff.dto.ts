import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'CreateStaffDto description' })
export class CreateStaffDto {
  @ApiProperty({ description: 'The full name of the staff' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'The username of the staff' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'The password of the staff' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'The role of the staff' })
  @IsString()
  role: string;
}
