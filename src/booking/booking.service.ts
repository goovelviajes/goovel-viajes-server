import { BadRequestException, ConflictException, Injectable, Inject, forwardRef, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { JourneyStatus } from '../journey/enums/journey-status.enum';
import { JourneyType } from '../journey/enums/journey-type.enum';
import { JourneyService } from '../journey/journey.service';
import { Repository } from 'typeorm';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './enums/booking-status.enum';
import { UserService } from '../user/user.service';

@Injectable()
export class BookingService {
    constructor(
        @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
        @Inject(forwardRef(() => JourneyService))
        private readonly journeyService: JourneyService,
        private readonly userService: UserService
    ) { }

    async create(activeUser: ActiveUserInterface, createBookingDto: CreateBookingDto) {
        const user = await this.userService.getUserById(activeUser.id)

        // Validamos que no se repita la reserva
        const bookingExists = await this.verifyIfBookingExists(activeUser.id, createBookingDto.journeyId);

        if (bookingExists) {
            throw new ConflictException("Booking can't be repeated")
        }

        // Verificamos que no exista una reserva para el mismo usuario y viaje
        const isTimeRangeUnavailable = await this.verifyTimeAvailability(activeUser.id, createBookingDto.journeyId);

        if (isTimeRangeUnavailable) {
            throw new ConflictException("Date time is equal to another booking")
        }

        const journey = await this.journeyService.getById(createBookingDto.journeyId);

        if (journey.user.id === activeUser.id) {
            throw new BadRequestException("You can't book your own journey")
        }

        const departureTime = new Date(journey.departureTime);
        const now = new Date();

        // Validamos que la fecha de partida no sea menor a la fecha actual
        if (departureTime < now) {
            throw new BadRequestException("Journey departure time is in the past")
        }

        switch (journey.status) {
            case JourneyStatus.CANCELLED:
                throw new BadRequestException("Journey is cancelled");
            case JourneyStatus.COMPLETED:
                throw new BadRequestException("Journey is completed");
            default:
                break;
        }

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
            user: { id: user.id, name: user.name, lastname: user.lastname, email: user.email },
            journey: { id: journey.id, departureTime: journey.departureTime, type: journey.type, origin: journey.origin, destination: journey.destination },
            seatCount: createBookingDto.seatCount || null
        });

        return await this.bookingRepository.save(booking)
    }

    private async verifySeatsAvailability(journeyId: string, quantityToAdd: number) {
        const journey = await this.journeyService.getById(journeyId);
        const bookings = await this.bookingRepository.find({ where: { journey: { id: journeyId }, status: BookingStatus.PENDING } });

        const occupiedSeats = bookings.reduce((acc, booking) => {
            return acc + booking.seatCount;
        }, 0);

        return (occupiedSeats + quantityToAdd) <= journey.availableSeats
    }

    private async verifyIfBookingExists(userId: string, journeyId: string) {
        const booking = await this.bookingRepository.findOne({ where: { user: { id: userId }, journey: { id: journeyId } } });

        return !!booking
    }

    private async verifyTimeAvailability(userId: string, journeyId: string,) {
        const journey = await this.journeyService.getById(journeyId);

        const isTimeRangeUnavailable = !!await this.bookingRepository.findOne({ where: { user: { id: userId }, journey: { departureTime: journey.departureTime } } });

        return isTimeRangeUnavailable;
    }

    async userHasBookedJourney(userId: string, journeyId: string) {
        const booking = await this.bookingRepository.findOne({ where: { user: { id: userId }, journey: { id: journeyId } } });

        return !!booking
    }

    async getBookingsByUserId(userId: string, status: JourneyStatus) {
        const bookings = await this.bookingRepository.find({
            where: {
                user: { id: userId },
                journey: { status }
            },
            relations: ['journey', 'journey.user', 'journey.vehicle']
        });

        return bookings
    }

    async markBookingsAsCompleted(bookings: Booking[]) {
        if (!bookings) return;

        const updatedBookings = bookings.map((booking) => {
            return {
                ...booking,
                status: BookingStatus.FINISHED
            }
        })

        return await this.bookingRepository.save(updatedBookings)
    }

    async cancelBooking(passengerId: string, bookingId: string) {
        const booking = await this.bookingRepository.findOne({ where: { id: bookingId }, relations: ['user'] })

        if (!booking) {
            throw new NotFoundException("Booking not found")
        }

        if (booking.user.id !== passengerId) {
            throw new UnauthorizedException("You are not authorized to cancel this booking")
        }

        booking.status = BookingStatus.CANCELLED;

        await this.bookingRepository.save(booking)
    }
}