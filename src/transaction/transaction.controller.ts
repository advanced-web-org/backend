import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiOperation({ summary: 'Create a transaction' })
  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionService.create(createTransactionDto);
  }

  @ApiOperation({ summary: 'Get all transactions' })
  @Get()
  async findAllByCustomer(@Query('type') type: string = 'all') {
    // get the bankId and accountNumber from the auth token
    const bankId = 1;
    const accountNumber = 'A12345';

    const typeMethodMap: Record<string, () => any> = {
      received: async () =>
        await this.transactionService.findReceived(bankId, accountNumber),
      sent: () => this.transactionService.findSent(bankId, accountNumber),
      'debt-paid': async () =>
        await this.transactionService.findDebtPaid(bankId, accountNumber),
    };

    return (
      typeMethodMap[type]?.() ||
      (await this.transactionService.findAll(bankId, accountNumber))
    );
  }

  @ApiOperation({ summary: 'Get all transactions by accountID' })
  @Get('account/:AccountId')
  async findAllByAccount(
    @Param('AccountId') accountNumber: string,
    @Query('type') type: string = 'all',
  ) {
    // get the bankId from the auth token
    const bankId = 1;

    const typeMethodMap: Record<string, () => any> = {
      received: async () =>
        await this.transactionService.findReceived(bankId, accountNumber),
      sent: () => this.transactionService.findSent(bankId, accountNumber),
      'debt-paid': async () =>
        await this.transactionService.findDebtPaid(bankId, accountNumber),
    };

    return (
      typeMethodMap[type]?.() ||
      (await this.transactionService.findAll(bankId, accountNumber))
    );
  }

  @ApiOperation({ summary: 'Get all external transactions' })
  @Get('/external')
  async findAllExternal(
    @Query('startDate') startDate: string = '',
    @Query('endDate') endDate: string = '',
    @Query('externalBankId') externalBankId: string = '',
  ) {
    // get the bankId from admin auth token
    const bankId = 1;

    return await this.transactionService.findExternal(
      bankId,
      startDate,
      endDate,
      externalBankId,
    );
  }

  @ApiOperation({ summary: 'Get all external balance' })
  @Get('/external/balance')
  async findExternalBalance(
    @Query('externalBankId') externalBankId: string = '',
  ) {
    // get the bankId from admin auth token
    const bankId = 1;

    return await this.transactionService.findExternalBalance(
      bankId,
      externalBankId,
    );
  }

  @ApiOperation({ summary: 'Get a transaction by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update a transaction by ID' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(+id, updateTransactionDto);
  }

  @ApiOperation({ summary: 'Delete a transaction by ID' })
  @Post('/delete/:id')
  remove(@Param('id') id: string) {
    return this.transactionService.remove(+id);
  }
}
