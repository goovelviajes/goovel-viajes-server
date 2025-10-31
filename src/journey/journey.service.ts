import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { VehicleService } from 'src/vehicle/vehicle.service';
import { CreateJourneyDto } from './dtos/create-journey.dto';
import { Journey } from './entities/journey.entity';
import { JourneyStatus } from './enums/journey-status.enum';

@Injectable()
export class JourneyService {
  constructor(
    @InjectRepository(Journey) private readonly journeyRepository: Repository<Journey>,
    private readonly vehicleService: VehicleService,
  ) { }

  async createJourney(activeUser: ActiveUserInterface, createJourneyDto: CreateJourneyDto) {
    try {
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
        vehicle.id
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

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error creating journey');
    }
  }

  /**
   * Busca viajes repetidos para un mismo vehículo en la misma fecha
   */
  private async findRepeatedJourneys(departureTime: Date, vehicleId: string) {
    try {
      // Normalizar hora y eliminar segundos/milisegundos
      const startOfDay = new Date(departureTime);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(departureTime);
      endOfDay.setHours(23, 59, 59, 999);

      return await this.journeyRepository
        .createQueryBuilder('journey')
        .where('journey.vehicle = :vehicleId', { vehicleId })
        .andWhere('journey.departure_time BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
        .getOne();

    } catch (error) {
      throw new InternalServerErrorException('Error finding repeated journeys');
    }
  }

  async cancelJourney(id: string, activeUserId: string) {
    try {
      const journey = await this.journeyRepository.findOne({ where: { id }, relations: ['user'] })

      if (!journey) throw new NotFoundException("Journey not found");

      if (journey.status !== JourneyStatus.PENDING) throw new BadRequestException("Only a journey with pending status can be cancelled");

      if (journey.user.id !== activeUserId) throw new ForbiddenException("User must be journey owner");

      await this.journeyRepository.update(id, {
        status: JourneyStatus.CANCELLED
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException("Error cancelling journey")
      }
      console.error(error);
      throw new InternalServerErrorException('Error creating journey');
    }
  }

  async getPendingJourneys() {
    try {
      // Obtenemos la lista de viajes pendientes con sus respectivas relaciones visibles.
      const journeys = await this.journeyRepository.find({ where: { status: JourneyStatus.PENDING }, relations: ['user', 'vehicle'] });

      // Devolvemos los datos del usuario resumidos, evitando enviar datos sensibles innecesarios.
      return journeys.map((journey) => ({
        ...journey,
        user: {
          id: journey.user.id,
          name: journey.user.name,
          lastname: journey.user.lastname,
        },
        vehicle: {
          id: journey.vehicle.id,
          brand: journey.vehicle.brand,
          model: journey.vehicle.model,
          capacity: journey.vehicle.capacity,
          color: journey.vehicle.color,
          type: journey.vehicle.type,
          year: journey.vehicle.year,
        }
      }));
    } catch (error) {
      throw new InternalServerErrorException("Error getting list of journeys")
    }
    
  async getOwnjourneys(id: string) {
    try {
      return this.journeyRepository.find({ where: { user: { id } }, order: {createdAt: "DESC"} })
    } catch (error) {
      throw new InternalServerErrorException("Error getting active user published journeys")
    }
  }
}
