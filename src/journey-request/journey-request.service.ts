import { ConflictException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LocationDto } from 'src/common/dtos/location.dto';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { normalizeDate } from 'src/common/utils/date.util';
import { Repository } from 'typeorm';
import { CreateRequestDto } from './dtos/create-request.dto';
import { JourneyRequest } from './entities/journey-request.entity';
import { RequestType } from './enums/request-type.enum';

@Injectable()
export class JourneyRequestService {
    constructor(@InjectRepository(JourneyRequest) private readonly requestRepository: Repository<JourneyRequest>) { }

    async createRequest(user: ActiveUserInterface, requestDto: CreateRequestDto) {
        try {
            const newRequest = this.requestRepository.create({
                ...requestDto,
                user
            })

            const isRequestRepeated = !!await this.findRepeatedRequests(requestDto.origin, requestDto.destination, requestDto.requestedTime)

            if (isRequestRepeated) {
                throw new ConflictException("Request cannot be repeated")
            }

            return this.requestRepository.save(newRequest)
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Error creating request")
        }
    }

    private async findRepeatedRequests(origin: LocationDto, destination: LocationDto, requestedTime: Date) {
        try {
            requestedTime = normalizeDate(requestedTime);

            return await this.requestRepository
                .createQueryBuilder('journey_request')
                .where("JSON_EXTRACT(journey_request.origin, '$.name') = :originName", { originName: origin.name })
                .andWhere("JSON_EXTRACT(journey_request.destination, '$.name') = :destinationName", { destinationName: destination.name })
                .andWhere("journey_request.requested_time = :requestedTime", { requestedTime })
                .getOne();
        } catch (error) {
            throw new InternalServerErrorException("Error finding repeated requests")
        }
    }

    async findAll(id: string) {
        try {
            return await this.requestRepository.find({ where: { user: { id } } });
        } catch (error) {
            throw new InternalServerErrorException("Error getting all published requests")
        }
    }

    async cancelJourneyRequest(activeUserId: string, id: string) {
        try {
            const request = await this.requestRepository.findOne({ where: { id }, relations: ['user'] })

            if (!request) throw new NotFoundException("Request not found")

            if (request.user.id !== activeUserId) throw new ForbiddenException("User must be request owner")

            await this.requestRepository.update(id, {
                status: RequestType.CANCELLED
            })
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Error cancelling request")
        }
    }
}
