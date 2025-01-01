import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BankService } from './bank.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('banks')
@Controller('banks')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @ApiOperation({ summary: 'Create a bank' })
  @Post()
  create(@Body() createBankDto: CreateBankDto) {
    return this.bankService.create(createBankDto);
  }

  @ApiOperation({ summary: 'Get all banks' })
  @Get()
  findAll() {
    // get the bankId from auth token
    const bankId = 1;
    return this.bankService.findAll(bankId);
  }

  @ApiOperation({ summary: 'Get a bank by ID' })
  @Get(':bank_id')
  findOne(@Param('bank_id') bank_id: string) {
    return this.bankService.findOne(+bank_id);
  }

  @ApiOperation({ summary: 'Update a bank by ID' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBankDto: UpdateBankDto) {
    return this.bankService.update(+id, updateBankDto);
  }

  @ApiOperation({ summary: 'Delete a bank by ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bankService.remove(+id);
  }
}
