import { ConflictException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JourneyRequest } from './entities/journey-request.entity';
import { Repository } from 'typeorm';
import { CreateRequestDto } from './dtos/create-request.dto';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { LocationDto } from 'src/common/dtos/location.dto';
import { normalizeDate } from 'src/common/utils/date.util';

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
            console.log(error)
            throw new InternalServerErrorException("Error finding repeated requests")
        }
    }
}
