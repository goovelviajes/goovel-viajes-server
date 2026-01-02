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

@Injectable()
export class JourneyService {
  constructor(
    @InjectRepository(Journey) private readonly journeyRepository: Repository<Journey>,
    private readonly vehicleService: VehicleService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService
  ) { }

  async createJourney(activeUser: ActiveUserInterface, createJourneyDto: CreateJourneyDto) {
    // Obtener vehículo
    const vehicle = await this.vehicleService.getVehicleById(createJourneyDto.vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.user.id !== activeUser.id) {
      throw new ForbiddenException('Only one of your own vehicles can be selected');
    }

    // Validar que origen y destino no sean iguales
    if (createJourneyDto.origin.name === createJourneyDto.destination.name) {
      throw new ConflictException('Origin and destination cannot be the same');
    }

    // Validar que la fecha sea futura
    const now = new Date();
    if (createJourneyDto.departureTime <= now) {
      throw new ConflictException('Departure time must be in the future');
    }

    // Validar que el vehículo no tenga otro viaje el mismo día y hora
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

    // Crear viaje
    const newJourney = this.journeyRepository.create({
      ...createJourneyDto,
      vehicle,
      user: activeUser
    });

    return await this.journeyRepository.save(newJourney);
  }

  /**
   * Busca viajes repetidos para un mismo vehículo en la misma fecha
   */
  private async findRepeatedJourneys(departureTime: Date, vehicleId: string, userId: string) {
    // Normalizar hora y eliminar segundos/milisegundos
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

  async getJourneys(userId: string, status: JourneyStatus, role: 'driver' | 'passenger') {
    if (role === 'driver') {
      // CAMINO A: Soy el conductor, busco mis publicaciones
      const journeys = await this.journeyRepository.find({
        where: {
          status,
          user: { id: userId } // Filtramos para que solo vea SUS viajes
        },
        relations: ['user', 'vehicle', 'bookings', 'bookings.user'] // Agregamos bookings para calificar
      });

      return journeys.map((journey) => this.mapJourneyData(journey, 'driver'));
    } else {
      // CAMINO B: Soy pasajero, busco en qué viajes reservé
      const bookings = await this.bookingService.getBookingsByUserId(userId, status);

      return bookings.map((booking) => this.mapJourneyData(booking.journey, 'passenger'));
    }
  }

  // Función auxiliar para no repetir el mapeo de datos (DRY)
  private mapJourneyData(journey: Journey, role: 'driver' | 'passenger') {
    return {
      ...journey,
      user: {
        id: journey.user.id,
        name: journey.user.name,
        lastname: journey.user.lastname,
      },
      vehicle: journey.vehicle || null,
      bookings: role === 'driver' ? journey.bookings?.map(b => ({
        id: b.user.id,
        name: b.user.name,
        lastname: b.user.lastname
      })) || [] : null
    };
  }

  async getOwnjourneys(id: string) {
    return this.journeyRepository.find({ where: { user: { id } }, order: { createdAt: "DESC" } })
  }

  async getById(id: string) {
    const journey = await this.journeyRepository.findOne({ where: { id }, relations: ['user', 'user.profile', 'vehicle'] });

    if (!journey) {
      throw new NotFoundException("Journey not found")
    }

    return journey;
  }

  async getJourneyByIdWithBookings(id: string) {
    const journey = await this.journeyRepository.createQueryBuilder('journey')
      .select([
        'journey.id',
        'journey.origin',
        'journey.destination',
        'journey.type',
        'journey.createdAt',
        'journey.pricePerSeat',
        'driver.id',
        'driver.name',
        'driver.lastname',
        'bookings.id',
        'bookings.createdAt',
        'bookings.seatCount',
        'user.id',
        'user.name',
        'user.lastname',
        'profile.image',
      ])
      .leftJoin('journey.bookings', 'bookings')
      .leftJoin('journey.user', 'driver')
      .leftJoin('bookings.user', 'user')
      .leftJoin('user.profile', 'profile')
      .where('journey.id = :id', { id })
      .getOne()

    if (!journey) {
      throw new NotFoundException("Journey not found")
    }

    return journey;
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

