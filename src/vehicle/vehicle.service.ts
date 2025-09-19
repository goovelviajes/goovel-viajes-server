import { ConflictException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';

@Injectable()
export class VehicleService {
    constructor(@InjectRepository(Vehicle) private readonly vehicleRepository: Repository<Vehicle>) { }

    async create(userId: string, createVehicleDto: CreateVehicleDto) {
        try {
            const isVehicleAlreadyExistent = await this.verifyIfVehicleExists(createVehicleDto.plate, userId);

            if (isVehicleAlreadyExistent.length > 0) {
                throw new ConflictException('Vehicle plate already exist')
            }

            const vehicle = this.vehicleRepository.create({ ...createVehicleDto, user: { id: userId } });

            return await this.vehicleRepository.save(vehicle)
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Error creating new vehicle")
        }
    }

    // Verifica si un vehiculo esta cargado con la misma patente, dentro del conjunto de vehiculos propio.
    async verifyIfVehicleExists(plate: string, userId: string) {
        try {
            return await this.vehicleRepository.find({ where: { plate, user: { id: userId } } })
        } catch (error) {
            throw new InternalServerErrorException("Error verifying if vehicle exists")
        }
    }

}
