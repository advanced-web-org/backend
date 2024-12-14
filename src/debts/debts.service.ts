import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) { }
  
  async createDebt(data: Prisma.DebtCreateInput) {
    return this.prisma.debt.create({
      data,
    });
  }
}
