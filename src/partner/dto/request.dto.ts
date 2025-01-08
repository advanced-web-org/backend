import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class HeaderDto {
  @ApiProperty({ description: 'Hash method used' })
  @IsString()
  @IsNotEmpty()
  hashMethod: string;

  @ApiProperty({ description: 'Timestamp of the request' })
  @IsString()
  @IsNotEmpty()
  timestamp: string;
}

export class InboundRequestDto {
  @ApiProperty({ description: 'Header object containing hash method and timestamp' })
  @IsNotEmpty()
  header: HeaderDto;

  @ApiProperty({ description: 'Encrypted payload' })
  @IsString()
  @IsNotEmpty()
  encryptedPayload: string;

  @ApiProperty({ description: 'Integrity check value' })
  @IsString()
  @IsNotEmpty()
  integrity: string;

  @ApiProperty({ description: 'Signature of the request' })
  @IsOptional()
  signature: string;
}