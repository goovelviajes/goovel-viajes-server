import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { BookingStatus } from 'src/booking/enums/booking-status.enum';
import { MoreThan, Not, Repository } from 'typeorm';
import { BookingService } from '../booking/booking.service';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { VehicleService } from '../vehicle/vehicle.service';
import { CreateJourneyDto } from './dtos/create-journey.dto';
import { Journey } from './entities/journey.entity';
import { JourneyStatus } from './enums/journey-status.enum';
import { JourneyType } from './enums/journey-type.enum';
import { verifyTimePassed } from 'src/common/utils/verify-time-passed';

@Injectable()
export class JourneyService {
  private readonly logger = new Logger(JourneyService.name);
  private readonly journeyEvents$ = new Subject<any>();

  constructor(
    @InjectRepository(Journey) private readonly journeyRepository: Repository<Journey>,
    private readonly vehicleService: VehicleService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,

  ) { }

  async createJourney(activeUser: ActiveUserInterface, createJourneyDto: CreateJourneyDto) {
    try {
      const vehicle = await this.vehicleService.getVehicleById(createJourneyDto.vehicleId);

      if (!vehicle) {
        this.logger.warn(`[JOURNEY_CREATE_FAILED] - Vehicle not found: ${createJourneyDto.vehicleId} - User: ${activeUser.id}`);
        throw new NotFoundException('Vehicle not found');
      }

      if (vehicle.user.id !== activeUser.id) {
        this.logger.warn(`[JOURNEY_CREATE_FORBIDDEN] - User ${activeUser.id} tried to use vehicle ${vehicle.id} owned by ${vehicle.user.id}`);
        throw new ForbiddenException('Only one of your own vehicles can be selected');
      }

      if (createJourneyDto.origin.name === createJourneyDto.destination.name) {
        throw new ConflictException('Origin and destination cannot be the same');
      }

      if (createJourneyDto.availableSeats > vehicle.capacity) {
        this.logger.warn(`[JOURNEY_CREATE_CAPACITY_EXCEEDED] - Seats: ${createJourneyDto.availableSeats} - Max: ${vehicle.capacity}`);
        throw new BadRequestException('Available seats cannot be greater than vehicle capacity');
      }

      const now = new Date();
      if (createJourneyDto.departureTime <= now) {
        throw new ConflictException('Departure time must be in the future');
      }

      const isJourneyRepeated = !!await this.findRepeatedJourneys(
        createJourneyDto.departureTime,
        vehicle.id,
        activeUser.id
      );

      if (isJourneyRepeated) {
        this.logger.warn(`[JOURNEY_CREATE_REPEATED] - User: ${activeUser.id} - Vehicle: ${vehicle.id} - Time: ${createJourneyDto.departureTime}`);
        throw new ConflictException(
          'This vehicle already has a journey scheduled on the same day and time'
        );
      }

      const newJourney = this.journeyRepository.create({
        ...createJourneyDto,
        vehicle,
        user: activeUser,
        availableSeats: createJourneyDto.type === JourneyType.CARPOOL ? createJourneyDto.availableSeats || vehicle.capacity : undefined
      });

      const savedJourney = await this.journeyRepository.save(newJourney);

      this.logger.log(`[JOURNEY_CREATED] - ID: ${savedJourney.id} - Driver: ${activeUser.id} - Type: ${createJourneyDto.type}`);

      return savedJourney;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[JOURNEY_CREATE_CRITICAL_ERROR] - User: ${activeUser.id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error creating journey');
    }
  }

  private async findRepeatedJourneys(departureTime: Date, vehicleId: string, userId: string) {
    try {
      const startOfDay = new Date(departureTime);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(departureTime);
      endOfDay.setHours(23, 59, 59, 999);

      return await this.journeyRepository
        .createQueryBuilder('journey')
        .where('journey.vehicle = :vehicleId', { vehicleId })
        .andWhere('journey.user = :userId', { userId })
        .andWhere('journey.departure_time BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
        .getOne();

    } catch (error) {
      this.logger.error(
        `[JOURNEY_FIND_REPEATED_ERROR] - Vehicle: ${vehicleId} - User: ${userId} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error checking for duplicate journeys');
    }
  }

  async cancelJourney(id: string, activeUserId: string) {
    try {
      const journey = await this.journeyRepository.findOne({
        where: { id },
        relations: ['user', 'bookings', 'bookings.user']
      });

      if (!journey) {
        this.logger.warn(`[JOURNEY_CANCEL_NOT_FOUND] - ID: ${id} - User: ${activeUserId}`);
        throw new NotFoundException("Journey not found");
      }

      if (journey.status !== JourneyStatus.PENDING) {
        this.logger.warn(`[JOURNEY_CANCEL_INVALID_STATUS] - ID: ${id} - Status: ${journey.status}`);
        throw new BadRequestException("Only a journey with pending status can be cancelled");
      }

      if (journey.user.id !== activeUserId) {
        this.logger.warn(`[JOURNEY_CANCEL_FORBIDDEN] - User ${activeUserId} tried to cancel journey ${id} owned by ${journey.user.id}`);
        throw new ForbiddenException("User must be journey owner");
      }

      await this.journeyRepository.update(id, {
        status: JourneyStatus.CANCELLED
      });

      this.logger.log(`[JOURNEY_CANCELLED_SUCCESS] - ID: ${id} - Driver: ${activeUserId}`);

      const passengerIds = journey.bookings
        .filter(booking => booking.status === BookingStatus.PENDING)
        .map(booking => booking.user.id)
        .filter(id => id !== undefined);

      if (passengerIds.length > 0) {
        this.emitEvent({
          usersId: passengerIds,
          journeyId: id,
          type: 'journey_cancelled',
          reason: 'El conductor ha cancelado el viaje.'
        });
        this.logger.log(`[JOURNEY_CANCEL_NOTIFICATIONS_SENT] - Journey: ${id} - Passengers notified: ${passengerIds.length}`);
      }

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[JOURNEY_CANCEL_CRITICAL_ERROR] - ID: ${id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException("Error cancelling journey");
    }
  }

  async cancelAllJourneysById(userId: string) {
    try {
      const journeys = await this.journeyRepository.find({
        where: { status: JourneyStatus.PENDING, user: { id: userId } },
        relations: ['bookings', 'bookings.user']
      });

      if (journeys.length === 0) return;

      for (const journey of journeys) {
        journey.status = JourneyStatus.CANCELLED;

        if (journey.bookings && journey.bookings.length > 0) {
          for (const booking of journey.bookings) {
            booking.status = BookingStatus.CANCELLED;
          }

          this.emitEvent({
            usersId: journey.bookings.map(booking => booking.user.id),
            journeyId: journey.id,
            type: 'journey_cancelled',
            reason: 'El conductor ha sido suspendido.'
          });
        }
      }

      await this.journeyRepository.save(journeys);

      this.logger.log(`[JOURNEY_MASS_CANCEL_SUCCESS] - Driver ID: ${userId} - Journeys affected: ${journeys.length}`);

    } catch (error) {
      this.logger.error(
        `[JOURNEY_MASS_CANCEL_ERROR] - Driver ID: ${userId} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException("Error cancelling all journeys for the user");
    }
  }

  async getAllJourneysForFeed(activeUserId: string) {
    try {
      const now = new Date();

      const journeys = await this.journeyRepository.find({
        where: {
          status: JourneyStatus.PENDING,
          user: { id: Not(activeUserId) },
          departureTime: MoreThan(now)
        },
        relations: ['user', 'user.profile', 'vehicle', 'bookings', 'bookings.user'],
        select: {
          user: {
            id: true,
            name: true,
            lastname: true,
            profile: { id: true, image: true }
          },
          vehicle: { id: true, brand: true, model: true, plate: true },
          bookings: {
            id: true,
            seatCount: true,
            status: true,
            user: { id: true, name: true, lastname: true }
          }
        }
      });

      return journeys.map((journey) => this.transformJourney(journey));

    } catch (error) {
      this.logger.error(
        `[JOURNEY_FEED_ERROR] - User ID: ${activeUserId} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error retrieving journeys for feed');
    }
  }

  async getJourneys(userId: string, status: JourneyStatus, role: 'driver' | 'passenger') {
    try {
      if (role === 'driver') {
        const journeys = await this.journeyRepository.find({
          where: { status, user: { id: userId } },
          relations: ['user', 'vehicle', 'bookings', 'bookings.user']
        });
        return journeys.map((journey) => this.mapJourneyData(journey, 'driver'));
      } else {
        const bookings = await this.bookingService.getBookingsByUserId(userId, status);
        return bookings.map((booking) => this.mapJourneyData(booking.journey, 'passenger'));
      }
    } catch (error) {
      this.logger.error(
        `[GET_JOURNEYS_ERROR] - User: ${userId} - Role: ${role} - Status: ${status} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error retrieving journeys');
    }
  }

  private mapJourneyData(journey: Journey, role: 'driver' | 'passenger') {
    try {
      const journeyWithSeats = this.transformJourney(journey);
      return {
        ...journeyWithSeats,
        user: {
          id: journey.user.id,
          name: journey.user.name,
          lastname: journey.user.lastname,
        },
        vehicle: journey.vehicle || null,
        bookings: role === 'driver' ? journey.bookings?.map(b => ({
          id: b.user?.id,
          name: b.user?.name,
          lastname: b.user?.lastname,
          seatCount: b.seatCount
        })) || [] : null
      };
    } catch (error) {
      this.logger.error(
        `[MAP_JOURNEY_DATA_ERROR] - JourneyID: ${journey?.id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error mapping journey data');
    }
  }

  async getOwnjourneys(userId: string) {
    try {
      const journeys = await this.journeyRepository.find({
        where: { user: { id: userId } },
        relations: ['user', 'bookings'],
        order: { createdAt: "DESC" },
        select: {
          user: { id: true, name: true, lastname: true }
        }
      });

      return journeys.map(journey => this.transformJourney(journey));

    } catch (error) {
      this.logger.error(
        `[GET_OWN_JOURNEYS_ERROR] - User ID: ${userId} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error retrieving your journeys');
    }
  }

  async getById(id: string) {
    try {
      const journey = await this.journeyRepository.findOne({
        where: { id },
        relations: ['user', 'user.profile', 'vehicle', 'bookings', 'bookings.user', 'bookings.user.profile'],
        select: {
          user: { id: true, name: true, lastname: true, email: true },
          bookings: {
            id: true, seatCount: true, status: true, createdAt: true,
            user: {
              id: true, name: true, lastname: true, email: true,
              profile: { id: true, image: true }
            }
          }
        }
      });

      if (!journey) {
        this.logger.warn(`[JOURNEY_GET_BY_ID_NOT_FOUND] - ID: ${id}`);
        throw new NotFoundException("Journey not found");
      }

      return this.transformJourney(journey);

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[JOURNEY_GET_BY_ID_CRITICAL_ERROR] - ID: ${id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error retrieving journey details');
    }
  }

  async getJourneyByIdWithBookings(id: string) {
    try {
      const journey = await this.journeyRepository.createQueryBuilder('journey')
        .leftJoin('journey.bookings', 'bookings')
        .leftJoin('journey.user', 'driver')
        .leftJoin('bookings.user', 'user')
        .leftJoin('user.profile', 'profile')
        .leftJoin('driver.profile', 'driverProfile')
        .select([
          'journey',
          'bookings.id',
          'bookings.seatCount',
          'bookings.status',
          'bookings.createdAt',
          'driver.id',
          'driver.name',
          'driver.lastname',
          'driver.email',
          'driverProfile.id',
          'driverProfile.profileName',
          'driverProfile.image',
          'user.id',
          'user.name',
          'user.lastname',
          'user.email',
          'profile.id',
          'profile.image',
          'profile.profileName'
        ])
        .where('journey.id = :id', { id })
        .getOne();

      if (!journey) {
        this.logger.warn(`[JOURNEY_QUERY_BUILDER_NOT_FOUND] - ID: ${id}`);
        throw new NotFoundException("Journey not found");
      }

      return this.transformJourney(journey);

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[JOURNEY_QUERY_BUILDER_ERROR] - ID: ${id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error retrieving journey with bookings');
    }
  }

  private transformJourney(journey: Journey) {
    try {
      // Incluir bookings PENDING y CONFIRMED como participantes activos        
      const activeBookings = journey.bookings
        ?.filter(b => b.status === BookingStatus.PENDING || b.status ===
          BookingStatus.CONFIRMED) || [];

      const occupiedSeats = activeBookings.reduce((acc, booking) => acc +
        booking.seatCount, 0);

      const passengers = activeBookings.map(b => ({
        id: b.user?.id,
        name: b.user?.name,
        lastname: b.user?.lastname
      }));

      return {
        ...journey,
        realAvailableSeats: journey.availableSeats - occupiedSeats,
        passengers
      };
    } catch (error) {
      // Usamos un log de nivel error porque un fallo en la transformación 
      // rompería la respuesta del feed o de los detalles del viaje.
      this.logger.error(
        `[JOURNEY_TRANSFORM_ERROR] - Journey ID: ${journey?.id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error processing journey data');
    }
  }

  async markJourneyAsCompleted(id: string, activeUserId: string) {
    try {
      const journey = await this.journeyRepository.findOne({
        where: { id },
        relations: ['user', 'bookings']
      });

      if (!journey) {
        this.logger.warn(`[JOURNEY_COMPLETE_NOT_FOUND] - ID: ${id}`);
        throw new NotFoundException("Journey not found");
      }

      if (journey.status !== JourneyStatus.PENDING) {
        this.logger.warn(`[JOURNEY_COMPLETE_INVALID_STATUS] - ID: ${id} - Current Status: ${journey.status}`);
        throw new BadRequestException("Only a journey with pending status can be marked as completed");
      }

      if (journey.user.id !== activeUserId) {
        this.logger.warn(`[JOURNEY_COMPLETE_FORBIDDEN] - User ${activeUserId} tried to complete journey ${id} owned by ${journey.user.id}`);
        throw new ForbiddenException("User must be journey owner");
      }

      // Verificamos que la fecha de salida sea mayor a la fecha actual (según tu lógica original)
      const isTimePassed = verifyTimePassed(journey.departureTime);
      if (isTimePassed) {
        this.logger.warn(`[JOURNEY_COMPLETE_TIME_REJECTED] - Journey ID: ${id} - Departure: ${journey.departureTime}`);
        throw new BadRequestException("Journey cannot be marked as completed");
      }

      // Marcamos las reservas como completadas
      await this.bookingService.markBookingsAsCompleted(journey.bookings);

      await this.journeyRepository.update(id, {
        status: JourneyStatus.COMPLETED
      });

      this.logger.log(`[JOURNEY_COMPLETED_SUCCESS] - ID: ${id} - Driver: ${activeUserId} - Bookings affected: ${journey.bookings?.length || 0}`);

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[JOURNEY_COMPLETE_CRITICAL_ERROR] - ID: ${id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException("Error marking journey as completed");
    }
  }

  async countCompletedByDriver(userId: string) {
    try {
      const journeys = await this.journeyRepository.count({
        where: {
          user: { id: userId },
          status: JourneyStatus.COMPLETED
        }
      });

      return journeys;

    } catch (error) {
      // Logeamos el error pero no lanzamos BadRequest porque es una consulta interna de conteo
      this.logger.error(
        `[JOURNEY_COUNT_COMPLETED_ERROR] - User ID: ${userId} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error counting completed journeys');
    }
  }

  async countCompletedByPassenger(userId: string) {
    try {
      const bookings = await this.bookingService.getBookingsByUserId(userId, JourneyStatus.COMPLETED);

      return bookings.length;
    } catch (error) {
      this.logger.error(
        `[JOURNEY_COUNT_PASSENGER_ERROR] - User ID: ${userId} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error counting completed passenger journeys');
    }
  }

  emitEvent(payload: {
    usersId: string[],
    journeyId: string,
    type: 'journey_cancelled' | 'booking_cancelled' | 'proposal_cancelled' | 'booking_created',
    reason: string
  }) {
    try {
      this.journeyEvents$.next({
        type: payload.type,
        ...payload
      });

      this.logger.log(
        `[JOURNEY_EVENT_EMITTED] - Type: ${payload.type} - Recipients: ${payload.usersId.length} - Journey: ${payload.journeyId}`
      );
    } catch (error) {
      // Es vital loguear esto como ERROR porque si el Stream (Subject) falla, 
      // los usuarios dejarán de recibir notificaciones en tiempo real.
      this.logger.error(
        `[JOURNEY_EVENT_EMIT_ERROR] - Type: ${payload.type} - Journey: ${payload.journeyId} - Error: ${error.message}`,
        error.stack
      );
    }
  }

  // Stream de actualizaciones
  streamUpdates(userId: string) {
    try {
      this.logger.log(`[JOURNEY_STREAM_SUBSCRIPTION] - User: ${userId} connected to updates`);

      return this.journeyEvents$.asObservable().pipe(
        filter((event) => {
          const isTargetUser = event.usersId.includes(userId);
          if (isTargetUser) {
            this.logger.debug?.(`[JOURNEY_STREAM_EVENT_FILTER] - Forwarding ${event.type} to User: ${userId}`);
          }
          return isTargetUser;
        }),
        map((event) => ({
          data: event
        }))
      );
    } catch (error) {
      this.logger.error(
        `[JOURNEY_STREAM_CRITICAL_ERROR] - User: ${userId} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error establishing update stream');
    }
  }
}