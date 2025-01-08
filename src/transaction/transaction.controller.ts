import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import {
  CreateTransactionDto,
  InternalTransactionDto,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

@ApiTags('Transactions API')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiOperation({ summary: 'Create a transaction' })
  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return `This action creates a new transaction`;
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

  // @ApiOperation({ summary: 'Get a transaction by ID' })
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.transactionService.findOne(+id);
  // }

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

  @UseGuards(JwtAuthGuard)
  @Post('request_otp')
  async requestOtp(@CurrentUser() user: any) {
    return this.transactionService.requestOtpForTransaction(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify_otp')
  async verifyOtp(
    @CurrentUser() user: any,
    @Body()
    body: { otp: string; otpToken: string; transaction: CreateTransactionDto },
  ) {
    return this.transactionService.verifyOtpForTransaction(
      user.userId,
      body.otp,
      body.otpToken,
      body.transaction,
    );
  }

  @Get('test')
  async test() {
    const internalTransactionPayload: InternalTransactionDto = {
      from_bank_id: 1,
      from_account_number: 'A12345',
      to_bank_id: 2,
      to_account_number: 'ACC123456789',
      transaction_type: 'transaction',
      transaction_amount: 100,
      transaction_message: 'Test transaction',
      fee_payer: 'from',
      fee_amount: 10,
    };
  
    try {
      await this.transactionService.makeOutboundTransaction(internalTransactionPayload);
      console.log('Outbound transaction successful');
    } catch (error) {
      console.error('Error making outbound transaction:', error);
    }
  }

  @Post('/external')
  async makeExternalTransaction(@Body() payload: InternalTransactionDto) {
    try {
      await this.transactionService.makeOutboundTransaction(payload);
      console.log('Outbound transaction successful');
    } catch (error) {
      console.error('Error making outbound transaction:', error);
    }
  }
}
