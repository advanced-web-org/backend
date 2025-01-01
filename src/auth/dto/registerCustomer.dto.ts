import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

@ApiSchema({ name: 'RegisterCustomerDto description' })
export class RegisterCustomerDto {
  @ApiProperty({ description: 'The full name of the customer' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'The email of the customer' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'The phone number of the customer' })
  @IsPhoneNumber('VN')
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'The password of the customer' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
