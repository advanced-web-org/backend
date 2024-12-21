import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { DebtsService } from './debts.service';
import CreateDebtDto from './dto/create-debt.dto';
import { DebtStatus } from './enum/debt-status.enum';
import { Debt } from '@prisma/client';
import DebtsValidator from './validator/debts.validator';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Controller('debts')
export class DebtsController {
  constructor(
    private readonly debtsService: DebtsService,
    private readonly debtsValidator: DebtsValidator,
  ) { }


  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDebt(@Body() createDebtDto: CreateDebtDto) {
    await this.debtsValidator.checkAccountExistence(createDebtDto.creditor_id, 'Creditor');
    await this.debtsValidator.checkAccountExistence(createDebtDto.debtor_id, 'Debtor');

    const createdDebt = await this.debtsService.createDebt(createDebtDto);
    return createdDebt;
  }

  @Get("creditor/:creditor_id")
  @HttpCode(HttpStatus.OK)
  async getCreditorDebts(@Param('creditor_id') creditorId: number, @Query('status') status?: DebtStatus): Promise<Debt[]> {
    await this.debtsValidator.checkAccountExistence(creditorId, 'Creditor');

    return this.debtsService.getCreditorDebts(creditorId, status);
  }


  @Get("debtor/:debtor_id")
  @HttpCode(HttpStatus.OK)
  async getDebtorDebts(@Param('debtor_id') debtorId: number, @Query('status') status?: DebtStatus): Promise<Debt[]> {
    await this.debtsValidator.checkAccountExistence(debtorId, 'Debtor');

    return this.debtsService.getDebtorDebts(debtorId, status);
  }

  @Get('/:debt_id/initiate-debt-payment')
  async initiatePayment(@Param('debt_id') debtId: number) {
    var userId = 2;

    return this.debtsService.initiatePayment(debtId, userId);
  }

  @Post('/:debt_id/confirm-debt-payment')
  async confirmPayment(@Body() { otp, otp_token }: { otp: string, otp_token: string }, @Param('debt_id') debtId: number) {
    var userId = 2;
    return this.debtsService.verifyOtpAndPayDebt(userId, debtId, otp, otp_token);
  }
}
