import { Controller } from '@nestjs/common';
import { JourneyRequestService } from './journey-request.service';

@Controller('journey-request')
export class JourneyRequestController {
  constructor(private readonly journeyRequestService: JourneyRequestService) {}
}
