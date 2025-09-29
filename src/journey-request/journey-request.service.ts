import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JourneyRequest } from './entities/journey-request.entity';
import { Repository } from 'typeorm';
import { CreateRequestDto } from './dtos/create-request.dto';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';

@Injectable()
export class JourneyRequestService {
    constructor(@InjectRepository(JourneyRequest) private readonly requestRepository: Repository<JourneyRequest>) { }

    async createRequest(user: ActiveUserInterface, requestDto: CreateRequestDto) {
        try {
            const newRequest = this.requestRepository.create({
                ...requestDto,
                user
            })

            return this.requestRepository.save(newRequest)
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Error creating request")
        }
    }
}
