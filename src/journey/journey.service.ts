import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
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
  private readonly journeyEvents$ = new Subject<any>();

  constructor(
    @InjectRepository(Journey) private readonly journeyRepository: Repository<Journey>,
    private readonly vehicleService: VehicleService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,

  ) { }

  async createJourney(activeUser: ActiveUserInterface, createJourneyDto: CreateJourneyDto) {
    const vehicle = await this.vehicleService.getVehicleById(createJourneyDto.vehicleId);

    if (!vehicle)
      throw new NotFoundException('Vehicle not found');


    if (vehicle.user.id !== activeUser.id)
      throw new ForbiddenException('Only one of your own vehicles can be selected');


    if (createJourneyDto.origin.name === createJourneyDto.destination.name)
      throw new ConflictException('Origin and destination cannot be the same');


    if (createJourneyDto.availableSeats > vehicle.capacity)
      throw new BadRequestException('Available seats cannot be greater than vehicle capacity');

    const now = new Date();
    if (createJourneyDto.departureTime <= now)
      throw new ConflictException('Departure time must be in the future');

    const isJourneyRepeated = !!await this.findRepeatedJourneys(
      createJourneyDto.departureTime,
      vehicle.id,
      activeUser.id
    );

    if (isJourneyRepeated) {
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

    return await this.journeyRepository.save(newJourney);
  }

  private async findRepeatedJourneys(departureTime: Date, vehicleId: string, userId: string) {
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
  }

  async cancelJourney(id: string, activeUserId: string) {
    const journey = await this.journeyRepository.findOne({ where: { id }, relations: ['user', 'bookings', 'bookings.user'] })

    if (!journey)
      throw new NotFoundException("Journey not found");

    if (journey.status !== JourneyStatus.PENDING)
      throw new BadRequestException("Only a journey with pending status can be cancelled");

    if (journey.user.id !== activeUserId)
      throw new ForbiddenException("User must be journey owner");

    await this.journeyRepository.update(id, {
      status: JourneyStatus.CANCELLED
    });

    const passengerIds = journey.bookings
      .filter(booking => booking.status === BookingStatus.PENDING)
      .map(booking => booking.user.id)
      .filter(id => id !== undefined);

    // Emitimos la cancelación para todos los pasajeros
    if (passengerIds.length > 0) {
      this.emitEvent({
        usersId: passengerIds,
        journeyId: id,
        type: 'journey_cancelled',
        reason: 'El conductor ha cancelado el viaje.'
      });
    }
  }

  async cancelAllJourneysById(userId: string) {
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
  }

  async getAllJourneysForFeed(activeUserId: string) {
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
  }

  async getJourneys(userId: string, status: JourneyStatus, role: 'driver' | 'passenger') {
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
  }

  private mapJourneyData(journey: Journey, role: 'driver' | 'passenger') {
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
  }

  async getOwnjourneys(userId: string) {
    const journeys = await this.journeyRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'bookings'],
      order: { createdAt: "DESC" },
      select: {
        user: { id: true, name: true, lastname: true }
      }
    });
    return journeys.map(journey => this.transformJourney(journey));
  }

  async getById(id: string) {
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

    if (!journey) throw new NotFoundException("Journey not found");
    return this.transformJourney(journey);
  }

  async getJourneyByIdWithBookings(id: string) {
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

    if (!journey) throw new NotFoundException("Journey not found");
    return this.transformJourney(journey);
  }

  private transformJourney(journey: Journey) {
    // Incluir bookings PENDING y CONFIRMED como participantes activos        
    const activeBookings = journey.bookings
      ?.filter(b => b.status === BookingStatus.PENDING || b.status ===
        BookingStatus.CONFIRMED) || [];

    const occupiedSeats = activeBookings.reduce((acc, booking) => acc +
      booking.seatCount, 0);

    const passengers = activeBookings.map(b => ({
      id: b.user.id,
      name: b.user.name,
      lastname: b.user.lastname
    }));

    return {
      ...journey,
      realAvailableSeats: journey.availableSeats - occupiedSeats,
      passengers
    };
  }

  async markJourneyAsCompleted(id: string, activeUserId: string) {
    const journey = await this.journeyRepository.findOne({ where: { id }, relations: ['user', 'bookings'] })
    if (!journey) throw new NotFoundException("Journey not found");
    if (journey.status !== JourneyStatus.PENDING) throw new BadRequestException("Only a journey with pending status can be marked as completed");
    if (journey.user.id !== activeUserId) throw new ForbiddenException("User must be journey owner");

    // Verificamos que la fecha de salida sea mayor a la fecha actual
    const isTimePassed = verifyTimePassed(journey.departureTime);

    if (isTimePassed) throw new BadRequestException("Journey cannot be marked as completed");

    // Marcamos las reservas como completadas
    await this.bookingService.markBookingsAsCompleted(journey.bookings);

    await this.journeyRepository.update(id, {
      status: JourneyStatus.COMPLETED
    });
  }

  async countCompletedByDriver(userId: string) {
    const journeys = await this.journeyRepository.count({
      where: {
        user: { id: userId },
        status: JourneyStatus.COMPLETED
      }
    });

    return journeys;
  }

  async countCompletedByPassenger(userId: string) {
    const bookings = await this.bookingService.getBookingsByUserId(userId, JourneyStatus.COMPLETED);

    return bookings.length;
  }

  emitEvent(payload: { usersId: string[], journeyId: string, type: 'journey_cancelled' | 'booking_cancelled' | 'proposal_cancelled' | 'booking_created', reason: string }) {
    this.journeyEvents$.next({
      type: payload.type,
      ...payload
    });
  }

  // Stream de actualizaciones
  streamUpdates(userId: string) {
    return this.journeyEvents$.asObservable().pipe(
      filter((event) => event.usersId.includes(userId)),
      map((event) => ({
        data: event
      }))
    )
  }
}