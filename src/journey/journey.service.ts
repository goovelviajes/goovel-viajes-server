import { 
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
  
  @Injectable()
  export class JourneyService {
    constructor(
      @InjectRepository(Journey) private readonly journeyRepository: Repository<Journey>,
      private readonly vehicleService: VehicleService,
    ) {}
  
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
        console.error(error);
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
        console.error(error);
        throw new InternalServerErrorException('Error finding repeated journeys');
      }
    }
  }
  