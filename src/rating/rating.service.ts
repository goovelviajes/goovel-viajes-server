import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { Rating } from './entities/rating.entity';
import { JourneyService } from 'src/journey/journey.service';
import { UserService } from 'src/user/user.service';
import { JourneyStatus } from 'src/journey/enums/journey-status.enum';
import { BookingService } from 'src/booking/booking.service';

@Injectable()
export class RatingService {
    constructor(
        @InjectRepository(Rating)
        private readonly ratingRepository: Repository<Rating>,
        private readonly journeyService: JourneyService,
        private readonly userService: UserService,
        private readonly bookingService: BookingService
    ) { }

    async createRating(raterId: string, dto: CreateRatingDto): Promise<Rating> {
        const { journeyId, ratedId, comment, rating } = dto;

        const journey = await this.journeyService.getById(journeyId);
        const raterUser = await this.userService.getUserById(raterId);
        const ratedUser = await this.userService.getUserById(ratedId || journey.user.id);
        await this.verifyIfJourneyIsCompleted(journeyId);

        if (raterUser.id === ratedUser.id) {
            throw new BadRequestException('You cannot rate yourself');
        }

        const isDriver = journey.user.id === raterUser.id;
        await this.verifyIfRatingExists(raterId, journeyId, isDriver, ratedId);
        if (isDriver) {
            await this.verifyIfPassengerTravelledInJourney(journeyId, ratedUser.id);
        } else {
            await this.verifyIfPassengerTravelledInJourney(journeyId, raterUser.id);
        }

        const newRating = this.ratingRepository.create({
            journey,
            comment,
            rating,
            raterUser,
            ratedUser
        });
        return this.ratingRepository.save(newRating);
    }

    private async verifyIfRatingExists(raterId: string, journeyId: string, isDriver: boolean, ratedId?: string): Promise<void> {

        if (!isDriver) {
            const rating = await this.ratingRepository.findOne({ where: { raterUser: { id: raterId }, journey: { id: journeyId } } });
            if (rating) {
                throw new BadRequestException('You have already rated this journey');
            }
        } else {
            const rating = await this.ratingRepository.findOne({ where: { raterUser: { id: raterId }, ratedUser: { id: ratedId }, journey: { id: journeyId } } });
            if (rating) {
                throw new BadRequestException('You have already been rated for this passenger');
            }
        }
    }

    private async verifyIfJourneyIsCompleted(journeyId: string): Promise<void> {
        const journey = await this.journeyService.getById(journeyId);
        if (journey.status !== JourneyStatus.COMPLETED) {
            throw new BadRequestException('Journey must be completed to rate it');
        }
    }

    private async verifyIfPassengerTravelledInJourney(journeyId: string, passengerId: string): Promise<void> {
        const userHasBookedJourney = await this.bookingService.userHasBookedJourney(passengerId, journeyId);
        if (!userHasBookedJourney) {
            throw new BadRequestException('Passenger must have travelled in the journey to rate it');
        }
    }
}
