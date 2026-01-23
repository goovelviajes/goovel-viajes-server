import { BadRequestException, ConflictException, Injectable, Inject, forwardRef, NotFoundException, UnauthorizedException, HttpException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { JourneyStatus } from '../journey/enums/journey-status.enum';
import { JourneyType } from '../journey/enums/journey-type.enum';
import { JourneyService } from '../journey/journey.service';
import { In, Not, Repository } from 'typeorm';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './enums/booking-status.enum';
import { UserService } from '../user/user.service';
import { verifyTimePassed } from '../common/utils/verify-time-passed';

@Injectable()
export class BookingService {
    private readonly logger = new Logger(BookingService.name);
    constructor(
        @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
        @Inject(forwardRef(() => JourneyService))
        private readonly journeyService: JourneyService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService
    ) { }

    async create(activeUser: ActiveUserInterface, createBookingDto: CreateBookingDto) {
        try {
            const user = await this.userService.getUserById(activeUser.id)

            // Validamos que no se repita la reserva
            const bookingExists = await this.verifyIfBookingExists(activeUser.id, createBookingDto.journeyId);

            if (bookingExists) {
                this.logger.warn(`[BOOKING_CREATE_DUPLICATE] - User: ${activeUser.id} - Journey: ${createBookingDto.journeyId}`);
                throw new ConflictException("Booking can't be repeated")
            }

            // Verificamos que no exista una reserva para el mismo usuario y viaje
            const isTimeRangeUnavailable = await this.verifyTimeAvailability(activeUser.id, createBookingDto.journeyId);

            if (isTimeRangeUnavailable) {
                this.logger.warn(`[BOOKING_CREATE_TIME_CONFLICT] - User: ${activeUser.id} - Journey: ${createBookingDto.journeyId}`);
                throw new ConflictException("Date time is equal to another booking")
            }

            const journey = await this.journeyService.getById(createBookingDto.journeyId);

            if (journey.user.id === activeUser.id)
                throw new BadRequestException("You can't book your own journey");

            // Validamos que la fecha de salida no sea menor a la fecha actual
            const isTimePassed = verifyTimePassed(journey.departureTime);
            if (isTimePassed)
                throw new BadRequestException("Journey departure time is in the past");

            // Validar Estado del Viaje
            if ([JourneyStatus.CANCELLED, JourneyStatus.COMPLETED].includes(journey.status)) {
                this.logger.warn(`[BOOKING_CREATE_INVALID_JOURNEY_STATUS] - Journey: ${journey.id} is ${journey.status}`);
                throw new BadRequestException(`Journey is ${journey.status.toLowerCase()}`);
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
                    this.logger.warn(`[BOOKING_CREATE_NO_SEATS] - Journey: ${journey.id} - Requested: ${createBookingDto.seatCount}`);
                    throw new ConflictException("No seats available")
                }
            }

            const booking = this.bookingRepository.create({
                isShipping: journey.type === JourneyType.PACKAGE,
                user: { id: user.id, name: user.name, lastname: user.lastname, email: user.email },
                journey: {
                    id: journey.id,
                    departureTime: journey.departureTime,
                    type: journey.type,
                    origin: journey.origin,
                    destination: journey.destination
                },
                seatCount: createBookingDto.seatCount || null
            });

            const savedBooking = await this.bookingRepository.save(booking);

            // Emitir evento de reserva creada
            this.journeyService.emitEvent({
                usersId: [journey.user.id],
                journeyId: journey.id,
                type: 'booking_created',
                reason: `¡Nueva reserva! ${user.name} ${user.lastname} se ha unido a tu viaje.`
            });

            this.logger.log(`[BOOKING_CREATED_SUCCESS] - ID: ${savedBooking.id} - User: ${user.id} - Journey: ${journey.id}`);

            return savedBooking;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[BOOKING_CREATE_CRITICAL_ERROR] - User: ${activeUser.id} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error creating booking");
        }
    }

    private async verifySeatsAvailability(journeyId: string, quantityToAdd: number) {
        try {
            const journey = await this.journeyService.getById(journeyId);

            const bookings = await this.bookingRepository.find({
                where: {
                    journey: { id: journeyId },
                    status: BookingStatus.PENDING
                }
            });

            const occupiedSeats = bookings.reduce((acc, booking) => {
                return acc + booking.seatCount;
            }, 0);

            const totalProjectedSeats = occupiedSeats + quantityToAdd;
            const isAvailable = totalProjectedSeats <= journey.vehicle.capacity;

            if (!isAvailable) {
                this.logger.warn(
                    `[BOOKING_CAPACITY_EXCEEDED] - Journey: ${journeyId} - Capacity: ${journey.vehicle.capacity} - Attempted: ${totalProjectedSeats}`
                );
            }

            return isAvailable;
        } catch (error) {
            this.logger.error(
                `[VERIFY_SEATS_ERROR] - Journey: ${journeyId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error verifying seats availability");
        }

    }

    private async verifyIfBookingExists(userId: string, journeyId: string) {
        try {
            // Buscamos cualquier reserva previa del usuario para este viaje específico
            const booking = await this.bookingRepository.findOne({
                where: {
                    user: { id: userId },
                    journey: { id: journeyId },
                    // Opcional: Podrías excluir reservas CANCELLED si permites re-intentos
                    status: Not(BookingStatus.CANCELLED)
                }
            });

            if (booking) {
                this.logger.debug?.(`[BOOKING_EXISTS_CHECK] - User: ${userId} already has a record for Journey: ${journeyId}`);
            }

            return !!booking;
        } catch (error) {
            this.logger.error(
                `[VERIFY_BOOKING_EXISTS_ERROR] - User: ${userId} - Journey: ${journeyId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error checking existing booking");
        }
    }

    private async verifyTimeAvailability(userId: string, journeyId: string,) {
        try {
            const journey = await this.journeyService.getById(journeyId);

            const existingConflict = await this.bookingRepository.findOne({
                where: {
                    user: { id: userId },
                    journey: { departureTime: journey.departureTime },
                    status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED])
                }
            });

            if (existingConflict) {
                this.logger.warn(
                    `[BOOKING_TIME_CONFLICT] - User: ${userId} already has a booking at ${journey.departureTime}`
                );
            }

            return !!existingConflict;;
        } catch (error) {
            this.logger.error(
                `[VERIFY_TIME_ERROR] - User: ${userId} - Journey: ${journeyId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error verifying time availability");
        }
    }

    async userHasBookedJourney(userId: string, journeyId: string) {
        try {
            // Verificamos si existe una reserva activa (no cancelada)
            const booking = await this.bookingRepository.findOne({
                where: {
                    user: { id: userId },
                    journey: { id: journeyId },
                    status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED])
                }
            });

            const hasBooking = !!booking;

            if (hasBooking) {
                this.logger.debug?.(`[BOOKING_VERIFY_SUCCESS] - User: ${userId} is confirmed for Journey: ${journeyId}`);
            }

            return hasBooking;

        } catch (error) {
            this.logger.error(
                `[USER_HAS_BOOKED_ERROR] - User: ${userId} - Journey: ${journeyId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error verifying user journey participation");
        }
    }

    async getBookingsByUserId(userId: string, status: JourneyStatus) {
        try {
            const bookings = await this.bookingRepository.find({
                where: {
                    user: { id: userId },
                    journey: { status }
                },
                relations: [
                    'journey',
                    'journey.user',
                    'journey.vehicle'
                ],
                // Ordenamos por los más recientes primero
                order: {
                    journey: { departureTime: 'ASC' }
                }
            });

            this.logger.log(`[BOOKING_FETCH_USER] - User: ${userId} - JourneyStatus: ${status} - Count: ${bookings.length}`);

            return bookings;

        } catch (error) {
            this.logger.error(
                `[BOOKING_FETCH_USER_ERROR] - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException('Error retrieving user bookings');
        }
    }

    async markBookingsAsCompleted(bookings: Booking[]) {
        try {
            if (!bookings || bookings.length === 0) {
                this.logger.debug?.('[BOOKING_COMPLETE_SKIP] - No bookings provided to mark as completed');
                return [];
            }

            // Actualizamos el estado de cada reserva
            const updatedBookings = bookings.map((booking) => {
                booking.status = BookingStatus.COMPLETED;
                return booking;
            });

            const savedBookings = await this.bookingRepository.save(updatedBookings);

            this.logger.log(
                `[BOOKING_COMPLETED_SUCCESS] - Total bookings updated: ${savedBookings.length}`
            );

            return savedBookings;

        } catch (error) {
            this.logger.error(
                `[BOOKING_COMPLETE_ERROR] - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error marking bookings as completed");
        }
    }

    async cancelBooking(passengerId: string, bookingId: string) {
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId },
            relations: ['user', 'journey', 'journey.user']
        })

        if (!booking)
            throw new NotFoundException("Booking not found");

        if (booking.status === BookingStatus.CANCELLED)
            throw new BadRequestException("Booking is already cancelled");

        if (booking.user.id !== passengerId)
            throw new UnauthorizedException("You are not authorized to cancel this booking");

        booking.status = BookingStatus.CANCELLED;

        await this.bookingRepository.save(booking)

        const driverId = booking.journey.user.id;

        this.journeyService.emitEvent({
            usersId: [driverId],
            journeyId: booking.journey.id,
            type: 'booking_cancelled',
            reason: `El pasajero ${booking.user.name} ${booking.user.lastname} ha cancelado su reserva.`
        })
    }

    async cancelAllBookingsById(userId: string) {
        try {
            // Importante: necesitamos las relaciones para obtener el ID del conductor y el nombre del usuario
            const bookings = await this.bookingRepository.find({
                where: {
                    user: { id: userId },
                    status: BookingStatus.PENDING
                },
                relations: ['journey', 'journey.user', 'user']
            });

            if (!bookings || bookings.length === 0) {
                this.logger.debug?.(`[BOOKING_CANCEL_ALL_SKIP] - No pending bookings for User: ${userId}`);
                return;
            }

            // 1. Mapeamos los cambios de estado
            const updatedBookings = bookings.map((booking) => {
                booking.status = BookingStatus.CANCELLED;
                return booking;
            });

            // 2. Emitimos los eventos a cada conductor afectado
            for (const booking of bookings) {
                this.journeyService.emitEvent({
                    usersId: [booking.journey.user.id],
                    journeyId: booking.journey.id,
                    type: 'booking_cancelled',
                    reason: `El pasajero ${booking.user.name} ${booking.user.lastname} ha cancelado su reserva.`
                });
            }

            // 3. Persistimos los cambios en lote
            await this.bookingRepository.save(updatedBookings);

            this.logger.log(
                `[BOOKING_CANCEL_ALL_SUCCESS] - User: ${userId} - Total bookings cancelled: ${bookings.length}`
            );

        } catch (error) {
            this.logger.error(
                `[BOOKING_CANCEL_ALL_ERROR] - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error cancelling all user bookings");
        }
    }
}