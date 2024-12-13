import { Test, TestingModule } from '@nestjs/testing';
import { QueryTestingService } from './query_testing.service';

describe('QueryTestingService', () => {
  let service: QueryTestingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryTestingService],
    }).compile();

    service = module.get<QueryTestingService>(QueryTestingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
