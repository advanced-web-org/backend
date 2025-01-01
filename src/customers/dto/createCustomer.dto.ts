import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsEmail, IsPhoneNumber, IsString } from "class-validator";

@ApiSchema({ name: 'CreateCustomerDto description' })
export class CreateCustomerDto {
  @ApiProperty({ description: 'The full name of the customer' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'The email of the customer' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The phone number of the customer' })
  @IsPhoneNumber('VN')
  phone: string;

  @ApiProperty({ description: 'The password of the customer' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'The refresh token of the customer' })
  @IsString()
  refreshToken?: string;
}