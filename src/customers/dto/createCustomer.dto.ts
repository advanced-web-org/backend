import { IsEmail, IsPhoneNumber, IsString } from "class-validator";

export class CreateCustomerDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('VN')
  phone: string;

  @IsString()
  password: string;

  @IsString()
  refreshToken?: string;
}