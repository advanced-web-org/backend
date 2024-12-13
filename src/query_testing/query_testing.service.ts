import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Transaction, Prisma } from '@prisma/client';

@Injectable()
export class QueryTestingService {
  constructor(private prisma: PrismaService) { }
  
  async getAllTransactions(): Promise<Transaction[] | null> {
    return this.prisma.transaction.findMany();
  }

}
