import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Repository } from 'typeorm';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { JourneyService } from 'src/journey/journey.service';
import { JourneyType } from 'src/journey/enums/journey-type.enum';
import { JourneyStatus } from 'src/journey/enums/journey-status.enum';
import { BookingStatus } from './enums/booking-status.enum';

@Injectable()
export class BookingService {
    constructor(@InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>, private readonly journeyService: JourneyService) { }

    async create(activeUser: ActiveUserInterface, createBookingDto: CreateBookingDto) {
        try {
            // Validamos que no se repita la reserva
            const bookingExists = await this.verifyIfBookingExists(activeUser.id, createBookingDto.journeyId);

            if (bookingExists) {
                throw new ConflictException("Booking can't be repeated")
            }

            const journey = await this.journeyService.getById(createBookingDto.journeyId);

            // Si el viaje es de tipo PACKAGE y se intenta pasar el campo seatCount generamos un error
            if (journey.type === JourneyType.PACKAGE && createBookingDto.seatCount)
                throw new BadRequestException("Property seatCount shouldn't exist");

            // Si el tipo de viaje es CARPOOL verificamos que efectivamente se este enviando el campo seatCount y tambien verificamos que haya asientos disponibles.
            if (journey.type === JourneyType.CARPOOL) {
                if (!createBookingDto.seatCount) {
                    throw new BadRequestException("Field seatCount is missing")
                }
                const AreAvailableSeats = await this.verifySeatsAvailability(createBookingDto.journeyId, createBookingDto.seatCount);

                if (!AreAvailableSeats) {
                    throw new ConflictException("No seats available")
                }
            }

            const booking = this.bookingRepository.create({
                isShipping: journey.type === JourneyType.PACKAGE,
                user: activeUser,
                journey,
                seatCount: createBookingDto.seatCount || null
            });

            return await this.bookingRepository.save(booking)
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Error creating new booking")
        }
    }

    private async verifySeatsAvailability(journeyId: string, quantityToAdd: number) {
        try {
            const journey = await this.journeyService.getById(journeyId);
            const bookings = await this.bookingRepository.find({ where: { journey: { id: journeyId }, status: BookingStatus.PENDING } });

            const occupiedSeats = bookings.reduce((acc, booking) => {
                return acc + booking.seatCount;
            }, 0);

            return (occupiedSeats + quantityToAdd) <= journey.availableSeats
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Error verifying seats availability")
        }
    }

    private async verifyIfBookingExists(userId: string, journeyId: string) {
        const booking = await this.bookingRepository.findOne({ where: { user: { id: userId }, journey: { id: journeyId } } });

        return !!booking
    }
}
