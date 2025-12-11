import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { TokenGuard } from 'src/auth/guard/token.guard';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { RatingCreatedResponseDto } from './dtos/rating-created-response.dto';
import { RatingService } from './rating.service';

@UseGuards(TokenGuard)
@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) { }

  @Post()
  @ApiCreatedResponse({ type: RatingCreatedResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'You cannot rate yourself, you have already rated this journey or passenger, or you are not the driver of the journey' })
  @ApiNotFoundResponse({ description: 'Journey or users not found' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while creating rating' })
  @ApiBearerAuth('access-token')
  async createRating(@Body() dto: CreateRatingDto, @ActiveUser() { id: raterId }: ActiveUserInterface) {
    return this.ratingService.createRating(raterId, dto);
  }
}
