import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";

@Injectable()
export default class DebtsValidator {
  constructor(private readonly prisma: PrismaService) { }

  async checkAccountExistence(accountId: number, accountRole: 'Creditor' | 'Debtor') {
    const account = await this.prisma.account.findUnique({ where: { account_id: accountId } });
    if (!account) {
      throw new BadRequestException(`${accountRole} account with ID ${accountId} was not found.`);
    }
    return account;
  }
  
}