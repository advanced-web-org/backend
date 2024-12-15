import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import CreateDebtDto from './dto/create-debt.dto';
import { DebtStatus } from './enum/debt-status.enum';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) { }

  async createDebt(createDebtDto: CreateDebtDto) {
    return this.prisma.debt.create({
      data: createDebtDto,
    });
  }
  private async checkAccountExistence(accountId: number, accountRole: 'Creditor' | 'Debtor') {
    const account = await this.prisma.account.findUnique({ where: { account_id: accountId } });
    if (!account) {
      throw new BadRequestException(`${accountRole} account with ID ${accountId} was not found.`);
    }
    return account;
  }

  async getCreditorDebts(creditorId: number, status?: DebtStatus) {
    const where: { creditor_id: number; status?: DebtStatus } = { creditor_id: creditorId };
  
    if (status !== undefined) {
      where.status = status;
    }
  
    return this.prisma.debt.findMany({ where });
  }
  
  async getDebtorDebts(debtorId: number, status?: DebtStatus) {
    const where: { debtor_id: number; status?: DebtStatus } = { debtor_id: debtorId };
  
    if (status !== undefined) {
      where.status = status;
    }
  
    return this.prisma.debt.findMany({ where });
  }

  async payDebt(debtId: number) {
    const debt = await this.prisma.debt.findUnique({ where: { debt_id: debtId } });
    if (!debt) {
      throw new BadRequestException(`Debt with ID ${debtId} was not found.`);
    }
  
    if (debt.status === DebtStatus.paid) {
      throw new BadRequestException(`Debt with ID ${debtId} is already paid.`);
    }

    if (debt.status === DebtStatus.deleted) {
      throw new BadRequestException(`Debt with ID ${debtId} is deleted.`);
    }
  
    return this.prisma.debt.update({
      where: { debt_id: debtId },
      data: { status: DebtStatus.paid },
    });
  }
}
