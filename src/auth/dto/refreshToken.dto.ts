import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'RefreshTokenDto description' })
export class RefreshTokenDto {
  @ApiProperty({ description: 'The username of the user' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'The refresh token of the user' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
