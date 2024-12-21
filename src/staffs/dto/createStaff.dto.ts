import { IsString } from "class-validator";

export class CreateStaffDto {
  @IsString()
  fullName: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  role: string;
}