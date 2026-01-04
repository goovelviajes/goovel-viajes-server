import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { VehicleService } from '../vehicle/vehicle.service';
import { Repository } from 'typeorm';
import { CreateJourneyDto } from './dtos/create-journey.dto';
import { Journey } from './entities/journey.entity';
import { JourneyStatus } from './enums/journey-status.enum';
import { BookingService } from '../booking/booking.service';
import { BookingStatus } from 'src/booking/enums/booking-status.enum';

@Injectable()
export class JourneyService {
  constructor(
    @InjectRepository(Journey) private readonly journeyRepository: Repository<Journey>,
    private readonly vehicleService: VehicleService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService
  ) { }

  async createJourney(activeUser: ActiveUserInterface, createJourneyDto: CreateJourneyDto) {
    const vehicle = await this.vehicleService.getVehicleById(createJourneyDto.vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.user.id !== activeUser.id) {
      throw new ForbiddenException('Only one of your own vehicles can be selected');
    }

    if (createJourneyDto.origin.name === createJourneyDto.destination.name) {
      throw new ConflictException('Origin and destination cannot be the same');
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
      throw new ConflictException(
        'This vehicle already has a journey scheduled on the same day and time'
      );
    }

    const newJourney = this.journeyRepository.create({
      ...createJourneyDto,
      vehicle,
      user: activeUser
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
    const journey = await this.journeyRepository.findOne({ where: { id }, relations: ['user'] })
    if (!journey) throw new NotFoundException("Journey not found");
    if (journey.status !== JourneyStatus.PENDING) throw new BadRequestException("Only a journey with pending status can be cancelled");
    if (journey.user.id !== activeUserId) throw new ForbiddenException("User must be journey owner");

    await this.journeyRepository.update(id, {
      status: JourneyStatus.CANCELLED
    });
  }

  async getAllJourneysForFeed() {
    const journeys = await this.journeyRepository.find({
      where: { status: JourneyStatus.PENDING },
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
      .select([
        'journey',
        'bookings.id', 'bookings.seatCount', 'bookings.status', 'bookings.createdAt',
        'driver.id', 'driver.name', 'driver.lastname', 'driver.email',
        'user.id', 'user.name', 'user.lastname', 'user.email',
        'profile.id', 'profile.image'
      ])
      .where('journey.id = :id', { id })
      .getOne();

    if (!journey) throw new NotFoundException("Journey not found");
    return this.transformJourney(journey);
  }

  private transformJourney(journey: Journey) {
    const occupiedSeats = journey.bookings
      ?.filter(b => b.status === BookingStatus.PENDING)
      .reduce((acc, booking) => acc + booking.seatCount, 0) || 0;

    return {
      ...journey,
      realAvailableSeats: journey.availableSeats - occupiedSeats,
    };
  }

  async markJourneyAsCompleted(id: string, activeUserId: string) {
    const journey = await this.journeyRepository.findOne({ where: { id }, relations: ['user'] })
    if (!journey) throw new NotFoundException("Journey not found");
    if (journey.status !== JourneyStatus.PENDING) throw new BadRequestException("Only a journey with pending status can be marked as completed");
    if (journey.user.id !== activeUserId) throw new ForbiddenException("User must be journey owner");

    await this.journeyRepository.update(id, {
      status: JourneyStatus.COMPLETED
    });
  }
}