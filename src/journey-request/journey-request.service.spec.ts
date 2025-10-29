import { Test, TestingModule } from '@nestjs/testing';
import { JourneyRequestService } from './journey-request.service';

describe('JourneyRequestService', () => {
  let service: JourneyRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JourneyRequestService],
    }).compile();

    service = module.get<JourneyRequestService>(JourneyRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
