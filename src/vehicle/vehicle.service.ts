import { ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { UpdateVehicleDto } from './dtos/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleType } from './enums/vehicle-type.enum';

@Injectable()
export class VehicleService {
    private readonly logger = new Logger(VehicleService.name);

    constructor(@InjectRepository(Vehicle) private readonly vehicleRepository: Repository<Vehicle>) { }

    async create(userId: string, createVehicleDto: CreateVehicleDto) {
        try {
            await this.verifyCapacity(createVehicleDto.type, createVehicleDto.capacity);

            const isVehicleAlreadyExistent = await this.verifyIfVehicleExists(createVehicleDto.plate);

            if (isVehicleAlreadyExistent.length > 0) {
                this.logger.warn(`[VEHICLE_CREATE_CONFLICT] - Plate: ${createVehicleDto.plate} already exists. Attempted by User: ${userId}`);
                throw new ConflictException('Vehicle plate already exist');
            }

            const vehicle = this.vehicleRepository.create({ ...createVehicleDto, user: { id: userId } });

            const savedVehicle = await this.vehicleRepository.save(vehicle)

            this.logger.log(`[VEHICLE_CREATED_SUCCESS] - ID: ${savedVehicle.id} - Plate: ${savedVehicle.plate} - Owner: ${userId}`);

            return savedVehicle;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[VEHICLE_CREATE_ERROR] - User: ${userId} - Plate: ${createVehicleDto.plate} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error creating vehicle");
        }
    }

    // Verifica la capacidad permitida para cada tipo de vehiculo
    async verifyCapacity(vehicleType: VehicleType, capacity: number) {
        try {
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

            this.logger.debug?.(`[VEHICLE_CAPACITY_VERIFIED] - Type: ${vehicleType} - Capacity: ${capacity}`);
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[VERIFY_CAPACITY_ERROR] - Type: ${vehicleType} - Capacity: ${capacity} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error verifying vehicle capacity");
        }
    }

    // Verifica si un vehiculo esta cargado con la misma patente, dentro del conjunto de vehiculos propio.
    async verifyIfVehicleExists(plate: string) {
        try {
            const vehicles = await this.vehicleRepository.find({
                where: { plate }
            });

            if (vehicles.length > 0) {
                this.logger.debug?.(`[VEHICLE_EXISTS_CHECK] - Plate: ${plate} found in database`);
            }

            return vehicles;

        } catch (error) {
            this.logger.error(
                `[VERIFY_VEHICLE_EXISTS_ERROR] - Plate: ${plate} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error checking vehicle existence");
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
                this.logger.warn(`[VEHICLE_UPDATE_NOT_FOUND] - ID: ${vehicleId} - By User: ${activeUserId}`);
                throw new NotFoundException("Vehicle not found");
            }

            const isOwner = vehicle.user.id === activeUserId;

            if (!isOwner) {
                this.logger.error(`[VEHICLE_UPDATE_FORBIDDEN] - User: ${activeUserId} tried to modify Vehicle: ${vehicleId}`);
                throw new ForbiddenException("You must be vehicle owner to modify it");
            }

            if (updateVehicleDto.type || updateVehicleDto.capacity) {
                await this.verifyCapacity(updateVehicleDto.type || vehicle.type, updateVehicleDto.capacity || vehicle.capacity);
            }

            const updatedVehicle = this.vehicleRepository.merge(vehicle, updateVehicleDto);
            await this.vehicleRepository.save(updatedVehicle);

            this.logger.log(`[VEHICLE_UPDATED_SUCCESS] - ID: ${vehicleId} - By User: ${activeUserId}`);

            return updatedVehicle;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[VEHICLE_UPDATE_ERROR] - ID: ${vehicleId} - User: ${activeUserId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error modifying vehicle");
        }

    }

    async getVehicleList(userId: string) {
        try {
            const vehicles = await this.vehicleRepository.find({
                where: { user: { id: userId } }
            });

            this.logger.log(`[VEHICLE_LIST_FETCH] - User: ${userId} - Count: ${vehicles.length}`);

            return vehicles;

        } catch (error) {
            this.logger.error(
                `[VEHICLE_LIST_ERROR] - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error retrieving vehicle list");
        }
    }

    async deleteVehicle(vehicleId: string, activeUserId: string) {
        try {
            const vehicle = await this.vehicleRepository.find({ where: { id: vehicleId, user: { id: activeUserId } } })

            if (vehicle.length === 0) {
                this.logger.warn(`[VEHICLE_DELETE_NOT_FOUND] - ID: ${vehicleId} - User: ${activeUserId}`);
                throw new NotFoundException("Vehicle not found in your list")
            }

            await this.vehicleRepository.delete(vehicleId);

            this.logger.log(`[VEHICLE_DELETED_SUCCESS] - ID: ${vehicleId} - By User: ${activeUserId}`);

            return {
                message: "Vehicle deleted successfully",
                id: vehicleId,
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[VEHICLE_DELETE_ERROR] - ID: ${vehicleId} - User: ${activeUserId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error deleting vehicle");
        }
    }

    async getVehicleById(vehicleId: string) {
        try {
            const vehicle = await this.vehicleRepository
                .createQueryBuilder("vehicle")
                .leftJoinAndSelect("vehicle.user", "user")
                .where("vehicle.id = :vehicleId", { vehicleId })
                .select([
                    "vehicle",
                    "user.id"
                ]).getOne()

            if (!vehicle) {
                this.logger.debug?.(`[GET_VEHICLE_NOT_FOUND] - ID: ${vehicleId}`);
            }

            return vehicle;
        } catch (error) {
            this.logger.error(
                `[GET_VEHICLE_BY_ID_ERROR] - ID: ${vehicleId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error retrieving vehicle details");
        }

    }
}
