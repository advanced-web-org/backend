import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExternalAccountDto } from './dto/external-account.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @ApiOperation({ summary: 'Create an account' })
  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @ApiOperation({ summary: 'Get all accounts' })
  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @ApiOperation({ summary: 'Get an account by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(+id);
  }

  findOnebyAccountNumber(accountNumber: string) {
    return this.accountsService.findOnebyAccountNumber(accountNumber);
  }

  @ApiOperation({ summary: 'Update an account by ID' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(+id, updateAccountDto);
  }

  @ApiOperation({ summary: 'Delete an account by ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountsService.remove(+id);
  }

  @ApiOperation({ summary: 'Get external account information' })
  @Post('external-account-info')
  async getExternalAccountInfo(@Body() externalAccountDto: ExternalAccountDto): Promise<ExternalAccountResponseDto> {
    const { accountNumber, bankCode } = externalAccountDto;
    return await this.accountsService.getExternalAccountInfo(accountNumber, bankCode);
  }
}

export interface ExternalAccountResponseDto {
  account_number: string;
  fullename: string;
}
