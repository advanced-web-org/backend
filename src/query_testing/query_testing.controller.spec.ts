import { Test, TestingModule } from '@nestjs/testing';
import { QueryTestingController } from './query_testing.controller';

describe('QueryTestingController', () => {
  let controller: QueryTestingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueryTestingController],
    }).compile();

    controller = module.get<QueryTestingController>(QueryTestingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
