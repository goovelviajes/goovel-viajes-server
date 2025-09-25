import { ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { UpdateVehicleDto } from './dtos/update-vehicle.dto';
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

    async modifyVehicle(vehicleId: string, activeUserId: string, updateVehicleDto: UpdateVehicleDto) {
        try {
            const vehicle = await this.vehicleRepository
                .createQueryBuilder('vehicle')
                .leftJoinAndSelect('vehicle.user', 'user')
                .select(['vehicle', 'user.id'])
                .where('vehicle.id = :vehicleId', { vehicleId })
                .getOne();

            if (!vehicle) {
                throw new NotFoundException("Vehicle not found")
            }

            const isOwner = vehicle.user.id === activeUserId;

            if (!isOwner) {
                throw new ForbiddenException("You must be vehicle owner to modify it")
            }

            const updatedVehicle = this.vehicleRepository.merge(vehicle, updateVehicleDto);
            await this.vehicleRepository.save(updatedVehicle);

            return updatedVehicle;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Error modifying vehicle")
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
