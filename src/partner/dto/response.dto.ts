import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class EncryptedResponseDto {
  @ApiProperty({ description: 'Encrypted payload' })
  @IsString()
  @IsNotEmpty()
  encryptedPayload: string;

  @ApiProperty({ description: 'Integrity check value' })
  @IsString()
  @IsNotEmpty()
  integrity: string;

  @ApiProperty({ description: 'Signature of the response' })
  @IsString()
  signature?: string;
}

export class ResponsePayloadDto {
  @ApiProperty({ description: 'Response status' })
  @IsNumber()
  @IsNotEmpty()
  statusCode: number;

  @ApiProperty({ description: 'Response message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Response data' })
  data?: any;
}