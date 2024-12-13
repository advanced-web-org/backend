import { Controller, Get } from '@nestjs/common';
import { QueryTestingService } from './query_testing.service';
import { Transaction } from '@prisma/client';

@Controller('query-testing')
export class QueryTestingController {
  constructor(private readonly queryTestingService: QueryTestingService) { }
  
  @Get()
  async getPostById(): Promise<Transaction[] | null> {
    return this.queryTestingService.getAllTransactions();
  }
}
