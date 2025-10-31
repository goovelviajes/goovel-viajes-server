import { Test, TestingModule } from '@nestjs/testing';
import { JourneyRequestController } from './journey-request.controller';
import { JourneyRequestService } from './journey-request.service';

describe('JourneyRequestController', () => {
  let controller: JourneyRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JourneyRequestController],
      providers: [JourneyRequestService],
    }).compile();

    controller = module.get<JourneyRequestController>(JourneyRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
