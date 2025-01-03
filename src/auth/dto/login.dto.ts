import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

@ApiSchema({ name: 'LoginDto description' })
export class LoginDto {
  @ApiProperty({ description: 'The username of the user' })
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'The password of the user' })
  @IsNotEmpty()
  password: string;
}
