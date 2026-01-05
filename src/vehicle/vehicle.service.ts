import { ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { UpdateVehicleDto } from './dtos/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleType } from './enums/vehicle-type.enum';

@Injectable()
export class VehicleService {
    constructor(@InjectRepository(Vehicle) private readonly vehicleRepository: Repository<Vehicle>) { }

    async create(userId: string, createVehicleDto: CreateVehicleDto) {
        await this.verifyCapacity(createVehicleDto.type, createVehicleDto.capacity);

        const isVehicleAlreadyExistent = await this.verifyIfVehicleExists(createVehicleDto.plate);

        if (isVehicleAlreadyExistent.length > 0) {
            throw new ConflictException('Vehicle plate already exist')
        }

        const vehicle = this.vehicleRepository.create({ ...createVehicleDto, user: { id: userId } });

        return await this.vehicleRepository.save(vehicle)
    }

    // Verifica la capacidad permitida para cada tipo de vehiculo
    async verifyCapacity(vehicleType: VehicleType, capacity: number) {
        if (vehicleType === VehicleType.MOTORCYCLE && capacity > 1)
            throw new ConflictException('Motorcycle can not have more than 1 seat');

        if (vehicleType === VehicleType.CAR && capacity > 5)
            throw new ConflictException('Car can not have more than 5 seats');

        if (vehicleType === VehicleType.UTILITY && capacity > 8)
            throw new ConflictException('Utility can not have more than 8 seats');

        if (vehicleType === VehicleType.VAN && capacity > 15)
            throw new ConflictException('Van can not have more than 15 seats');

        if (vehicleType === VehicleType.BUS && capacity > 25)
            throw new ConflictException('Bus can not have more than 25 seats');
    }

    // Verifica si un vehiculo esta cargado con la misma patente, dentro del conjunto de vehiculos propio.
    async verifyIfVehicleExists(plate: string) {
        return await this.vehicleRepository.find({ where: { plate } })
    }

    async modifyVehicle(vehicleId: string, activeUserId: string, updateVehicleDto: UpdateVehicleDto) {
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

        if (updateVehicleDto.type || updateVehicleDto.capacity) {
            await this.verifyCapacity(updateVehicleDto.type || vehicle.type, updateVehicleDto.capacity || vehicle.capacity);
        }

        const updatedVehicle = this.vehicleRepository.merge(vehicle, updateVehicleDto);
        await this.vehicleRepository.save(updatedVehicle);

        return updatedVehicle;
    }

    async getVehicleList(userId: string) {
        return await this.vehicleRepository.find({ where: { user: { id: userId } } })
    }

    async deleteVehicle(vehicleId: string, activeUserId: string) {
        const vehicle = await this.vehicleRepository.find({ where: { id: vehicleId, user: { id: activeUserId } } })

        if (vehicle.length === 0) {
            throw new NotFoundException("Vehicle not found in your list")
        }

        await this.vehicleRepository.delete(vehicle);

        return {
            message: "Vehicle deleted successfully",
            id: vehicleId,
        }
    }

    async getVehicleById(vehicleId: string) {
        return await this.vehicleRepository
            .createQueryBuilder("vehicle")
            .leftJoinAndSelect("vehicle.user", "user")
            .where("vehicle.id = :vehicleId", { vehicleId })
            .select([
                "vehicle",
                "user.id"
            ]).getOne()
    }
}
