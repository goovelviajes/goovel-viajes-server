import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
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
    private readonly logger = new Logger(RatingService.name);

    constructor(
        @InjectRepository(Rating)
        private readonly ratingRepository: Repository<Rating>,
        private readonly journeyService: JourneyService,
        private readonly userService: UserService,
        private readonly bookingService: BookingService
    ) { }

    async createRating(raterId: string, dto: CreateRatingDto): Promise<Rating> {
        try {
            const { journeyId, ratedId, comment, rating } = dto;

            // 1. Obtención de entidades básicas
            const journey = await this.journeyService.getById(journeyId);
            const raterUser = await this.userService.getUserById(raterId);

            // Si no viene ratedId, asumimos que el pasajero está calificando al dueño del viaje (conductor)
            const targetUserId = ratedId || journey.user.id;
            const ratedUser = await this.userService.getUserById(targetUserId);

            // 2. Validaciones de Reglas de Negocio
            await this.verifyIfJourneyIsCompleted(journeyId);

            if (raterUser.id === ratedUser.id) {
                throw new BadRequestException('You cannot rate yourself');
            }

            // Identificamos el rol del que califica para las validaciones posteriores
            const isRaterDriver = journey.user.id === raterUser.id;

            // 3. Verificaciones de Integridad
            // Verificamos que no exista una calificación previa para este viaje entre estos usuarios
            await this.verifyIfRatingExists(raterId, journeyId, isRaterDriver, targetUserId);

            // Verificamos que el pasajero realmente haya formado parte del viaje
            const passengerToCheck = isRaterDriver ? ratedUser.id : raterUser.id;
            await this.verifyIfPassengerTravelledInJourney(journeyId, passengerToCheck);

            // 4. Creación y Persistencia
            const newRating = this.ratingRepository.create({
                journey,
                comment,
                rating,
                raterUser,
                ratedUser
            });

            const savedRating = await this.ratingRepository.save(newRating);

            this.logger.log(
                `[RATING_CREATED] - From: ${raterId} To: ${targetUserId} - Journey: ${journeyId} - Stars: ${rating}`
            );

            return savedRating;

        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[RATING_CREATE_ERROR] - Rater: ${raterId} - Journey: ${dto.journeyId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error creating rating");
        }
    }

    private async verifyIfRatingExists(raterId: string, journeyId: string, isDriver: boolean, ratedId?: string): Promise<void> {
        try {
            if (!isDriver) {
                // El pasajero califica al conductor (solo una calificación por viaje)
                const rating = await this.ratingRepository.findOne({
                    where: {
                        raterUser: { id: raterId },
                        journey: { id: journeyId }
                    }
                });

                if (rating) {
                    throw new BadRequestException('You have already rated this journey');
                }
            } else {
                // El conductor califica a un pasajero específico (una calificación por cada pasajero del viaje)
                const rating = await this.ratingRepository.findOne({
                    where: {
                        raterUser: { id: raterId },
                        ratedUser: { id: ratedId },
                        journey: { id: journeyId }
                    }
                });

                if (rating) {
                    throw new BadRequestException('You have already been rated for this passenger');
                }
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[VERIFY_RATING_EXISTS_ERROR] - Rater: ${raterId} - Journey: ${journeyId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error verifying rating existence");
        }
    }

    private async verifyIfJourneyIsCompleted(journeyId: string): Promise<void> {
        try {
            const journey = await this.journeyService.getById(journeyId);

            if (journey.status !== JourneyStatus.COMPLETED) {
                this.logger.warn(`[RATING_ATTEMPT_INCOMPLETE_JOURNEY] - Journey: ${journeyId} Status: ${journey.status}`);
                throw new BadRequestException('Journey must be completed to rate it');
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[VERIFY_JOURNEY_COMPLETED_ERROR] - Journey: ${journeyId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error verifying journey status for rating");
        }
    }

    private async verifyIfPassengerTravelledInJourney(journeyId: string, passengerId: string): Promise<void> {
        try {
            const userHasBookedJourney = await this.bookingService.userHasBookedJourney(passengerId, journeyId);

            if (!userHasBookedJourney) {
                this.logger.warn(`[RATING_INVALID_PARTICIPANT] - User: ${passengerId} attempted to rate Journey: ${journeyId} without a valid booking`);
                throw new BadRequestException('Passenger must have travelled in the journey to rate it');
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[VERIFY_PASSENGER_TRAVELLED_ERROR] - User: ${passengerId} - Journey: ${journeyId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error verifying passenger participation for rating");
        }
    }

    async getAverageRating(ratedUserId: string) {
        try {
            const ratings = await this.ratingRepository.find({
                where: { ratedUser: { id: ratedUserId } }
            });

            if (ratings.length === 0) {
                this.logger.debug?.(`[GET_AVERAGE_RATING_EMPTY] - User: ${ratedUserId} has no ratings yet`);
                return 0;
            }

            const averageRating = ratings.reduce((acc, rating) => acc + Number(rating.rating), 0) / ratings.length;

            this.logger.log(`[GET_AVERAGE_RATING_SUCCESS] - User: ${ratedUserId} - Average: ${averageRating.toFixed(2)} - Total: ${ratings.length}`);

            return averageRating;

        } catch (error) {
            this.logger.error(
                `[GET_AVERAGE_RATING_ERROR] - User: ${ratedUserId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error calculating user average rating");
        }
    }

    async getRatingsByUser(ratedUserId: string) {
        try {
            const ratings = await this.ratingRepository.find({
                where: { ratedUser: { id: ratedUserId } },
                // Traemos también quién calificó para mostrar el nombre en el feed de reseñas
                relations: ['raterUser'],
                // Ordenamos por las más recientes primero
                order: { createdAt: 'DESC' }
            });

            this.logger.log(`[GET_RATINGS_FETCH] - User: ${ratedUserId} - Count: ${ratings.length}`);
            return ratings;

        } catch (error) {
            this.logger.error(
                `[GET_RATINGS_BY_USER_ERROR] - User: ${ratedUserId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error retrieving user ratings");
        }
    }
}
