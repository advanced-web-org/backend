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

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @Get()
  findAllByCustomer(@Query('type') type: string = 'all') {
    // get the bankId and accountNumber from the auth token
    const bankId = 1;
    const accountNumber = 'A12345';

    const typeMethodMap: Record<string, () => any> = {
      received: () =>
        this.transactionService.findReceived(bankId, accountNumber),
      sent: () => this.transactionService.findSent(bankId, accountNumber),
      'debt-paid': () =>
        this.transactionService.findDebtPaid(bankId, accountNumber),
    };

    return (
      typeMethodMap[type]?.() ||
      this.transactionService.findAll(bankId, accountNumber)
    );
  }

  @Get('/external')
  findAllExternal(
    @Query('startDate') startDate: string = '',
    @Query('endDate') endDate: string = '',
    @Query('externalBankId') externalBankId: string = '',
  ) {
    // get the bankId from admin auth token
    const bankId = 1;

    return this.transactionService.findExternal(
      bankId,
      startDate,
      endDate,
      externalBankId,
    );
  }

  @Get('/external/balance')
  findExternalBalance(@Query('externalBankId') externalBankId: string = '') {
    // get the bankId from admin auth token
    const bankId = 1;

    return this.transactionService.findExternalBalance(bankId, externalBankId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionService.remove(+id);
  }
}
