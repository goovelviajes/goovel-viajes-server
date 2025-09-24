import { ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';

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

    async getVehicleList(userId: string) {
        try {
            return await this.vehicleRepository.find({ where: { user: { id: userId } } })
        } catch (error) {
            throw new InternalServerErrorException("Error getting vehicles list")
        }
    }

    async deleteVehicle(vehicleId: string, activeUserId: string) {
        try {
            const vehicle = await this.vehicleRepository.find({ where: { id: vehicleId, user: { id: activeUserId } } })

            if (vehicle.length === 0) {
                throw new NotFoundException("Vehicle not found in your list")
            }

            await this.vehicleRepository.delete(vehicle);

            return {
                message: "Vehicle deleted successfully",
                id: vehicleId,
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Error deleting vehicle")
        }
    }
}
