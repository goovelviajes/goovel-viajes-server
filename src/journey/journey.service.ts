import { ConflictException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { VehicleService } from 'src/vehicle/vehicle.service';
import { Repository } from 'typeorm';
import { CreateJourneyDto } from './dtos/create-journey.dto';
import { Journey } from './entities/journey.entity';
import { LocationDto } from './dtos/location.dto';
import { normalizeDate } from 'src/common/utils/date.util';

@Injectable()
export class JourneyService {
    constructor(@InjectRepository(Journey) private readonly journeyRepository: Repository<Journey>, private readonly vehicleService: VehicleService) { }

    async createJourney(activeUser: ActiveUserInterface, createJourneyDto: CreateJourneyDto) {
        try {
            const vehicle = await this.vehicleService.getVehicleById(createJourneyDto.vehicleId);

            if (!vehicle) {
                throw new NotFoundException("Vehicle not found")
            }

            if (vehicle.user.id !== activeUser.id) {
                throw new ForbiddenException("Only one of your own vehicles can be selected")
            }

            const isJourneyRepeated = !!await this.findRepeatedJourneys(createJourneyDto.origin, createJourneyDto.destination, createJourneyDto.departureTime)

            if (isJourneyRepeated) {
                throw new ConflictException("Journey cannot be repeated")
            }

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
            throw new InternalServerErrorException("Error creating journey")
        }
    }

    private async findRepeatedJourneys(origin: LocationDto, destination: LocationDto, departureTime: Date) {
        try {
            departureTime = normalizeDate(departureTime);

            return await this.journeyRepository
                .createQueryBuilder('journey')
                .where("JSON_EXTRACT(journey.origin, '$.name') = :originName", { originName: origin.name })
                .andWhere("JSON_EXTRACT(journey.destination, '$.name') = :destinationName", { destinationName: destination.name })
                .andWhere("journey.departure_time = :departureTime", { departureTime })
                .getOne();
        } catch (error) {
            console.log(error)
            throw new InternalServerErrorException("Error finding repeated journeys")
        }
    }
}
