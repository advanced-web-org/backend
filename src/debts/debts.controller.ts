import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { DebtsService } from './debts.service';
import CreateDebtDto from './dto/create-debt.dto';

@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) { }
  

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDebt(@Body() createDebtDto: CreateDebtDto) {
    const createdDebt = await this.debtsService.createDebt(createDebtDto);
    return createdDebt;
  }
}
