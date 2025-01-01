import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DebtsService } from './debts.service';
import CreateDebtDto from './dto/create-debt.dto';
import { DebtStatus } from './enum/debt-status.enum';
import { Debt } from '@prisma/client';
import DebtsValidator from './validator/debts.validator';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUserType } from 'src/auth/types/current-user.type';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('debts')
@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtsController {
  constructor(
    private readonly debtsService: DebtsService,
    private readonly debtsValidator: DebtsValidator,
  ) {}

  @ApiOperation({ summary: 'Create a debt' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDebt(@Body() createDebtDto: CreateDebtDto) {
    await this.debtsValidator.checkAccountExistence(
      createDebtDto.creditor_id,
      'Creditor',
    );
    await this.debtsValidator.checkAccountExistence(
      createDebtDto.debtor_id,
      'Debtor',
    );

    const createdDebt = await this.debtsService.createDebt(createDebtDto);
    return createdDebt;
  }

  @ApiOperation({ summary: 'Get creditor debt by ID' })
  @Get('creditor/:creditor_id')
  @HttpCode(HttpStatus.OK)
  async getCreditorDebts(
    @Param('creditor_id') creditorId: number,
    @Query('status') status?: DebtStatus,
  ): Promise<Debt[]> {
    await this.debtsValidator.checkAccountExistence(creditorId, 'Creditor');

    return this.debtsService.getCreditorDebts(creditorId, status);
  }

  @ApiOperation({ summary: 'Get debtor debt by ID' })
  @Get('debtor/:debtor_id')
  @HttpCode(HttpStatus.OK)
  async getDebtorDebts(
    @Param('debtor_id') debtorId: number,
    @Query('status') status?: DebtStatus,
  ): Promise<Debt[]> {
    await this.debtsValidator.checkAccountExistence(debtorId, 'Debtor');

    return this.debtsService.getDebtorDebts(debtorId, status);
  }

  @ApiOperation({ summary: 'Get debt payment of a debt by ID' })
  @Get('/:debt_id/initiate-debt-payment')
  async initiatePayment(
    @Param('debt_id', ParseIntPipe) debtId: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.debtsService.initiatePayment(debtId, parseInt(user.userId));
  }

  @ApiOperation({ summary: 'Confirm debt (find by ID) payment' })
  @Post('/:debt_id/confirm-debt-payment')
  async confirmPayment(
    @Param('debt_id', ParseIntPipe) debtId: number,
    @Body() { otp, otp_token }: { otp: string; otp_token: string },
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.debtsService.verifyOtpAndPayDebt(
      parseInt(user.userId),
      debtId,
      otp,
      otp_token,
    );
  }

  @ApiOperation({ summary: 'Delete debt by ID' })
  @Delete('/:debt_id')
  async deleteDebt(
    @Param('debt_id', ParseIntPipe) debtId: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.debtsService.deleteDebt(debtId, parseInt(user.userId));
  }
}
