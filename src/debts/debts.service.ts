import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import CreateDebtDto from './dto/create-debt.dto';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) { }

  async createDebt(createDebtDto: CreateDebtDto) {
    await this.checkAccountExistence(createDebtDto.creditor_id, 'Creditor');
    await this.checkAccountExistence(createDebtDto.debtor_id, 'Debtor');

    return this.prisma.debt.create({
      data: createDebtDto,
    });
  }
  async checkAccountExistence(accountId: number, accountRole: 'Creditor' | 'Debtor') {
    const account = await this.prisma.account.findUnique({ where: { account_id: accountId } });
    if (!account) {
      throw new BadRequestException(`${accountRole} account with ID ${accountId} was not found.`);
    }
    return account;
  }
}
