import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { hashData } from './pgp.utils';

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) { }

  async getAccountInfo(bankId: number, accountNumber: string, hash: string, signature: string) {
    const bank = await this.prisma.bank.findUnique({ where: { bank_id: bankId } });
    if (!bank || !bank.public_key) throw new BadRequestException('Bank not registered.');

    const dataToHash = `${bankId}-${accountNumber}`;
    const expectedHash = hashData(dataToHash, bank.public_key);
    if (expectedHash !== hash) throw new BadRequestException('Hash mismatch.');
  }
}
