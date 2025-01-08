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
  @ApiProperty({
    example: 'Thieu Lac Quan',
    description: 'The full name of the customer',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: 'quanlac@gmail.com',
    description: 'The email of the customer',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '0293849328',
    description: 'The phone number of the customer',
  })
  @IsPhoneNumber('VN')
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'notpasss',
    description: 'The password of the customer',
  })
  @IsString()
  password: string;
}
