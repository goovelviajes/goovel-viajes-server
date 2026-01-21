import { ConflictException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LocationDto } from 'src/common/dtos/location.dto';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { normalizeDate } from 'src/common/utils/date.util';
import { In, Repository } from 'typeorm';
import { CreateRequestDto } from './dtos/create-request.dto';
import { JourneyRequest } from './entities/journey-request.entity';
import { RequestStatus } from './enums/request-status.enum';
import { JourneyType } from 'src/journey/enums/journey-type.enum';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JourneyRequestService {
    constructor(
        @InjectRepository(JourneyRequest) private readonly requestRepository: Repository<JourneyRequest>,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService
    ) { }

    async createRequest({ id }: ActiveUserInterface, requestDto: CreateRequestDto) {
        this.validateFieldsByType(requestDto)

        const newRequest = this.requestRepository.create({
            ...requestDto,
            user: { id }
        })

        const isRequestRepeated = !!await this.findRepeatedRequests(requestDto.origin, requestDto.destination, requestDto.requestedTime, id)

        if (isRequestRepeated) {
            throw new ConflictException("Request cannot be repeated")
        }

        return this.requestRepository.save(newRequest)
    }

    // Valida los campos especificos segun el tipo de viaje (CARPOOL o PACKAGE)
    private validateFieldsByType(requestDto: CreateRequestDto) {
        if (requestDto.type === JourneyType.PACKAGE) {
            if (requestDto.requestedSeats) {
                throw new BadRequestException("requestedSeats field is not required for package journeys")
            }
        }

        if (requestDto.type === JourneyType.CARPOOL) {
            if (requestDto.packageWeight) throw new BadRequestException("packageWeight field is not required for carpool journeys")
            if (requestDto.packageLength) throw new BadRequestException("packageLength field is not required for carpool journeys")
            if (requestDto.packageWidth) throw new BadRequestException("packageWidth field is not required for carpool journeys")
            if (requestDto.packageHeight) throw new BadRequestException("packageHeight field is not required for carpool journeys")
            if (requestDto.packageDescription) throw new BadRequestException("packageDescription field is not required for carpool journeys")
        }
    }

    private async findRepeatedRequests(origin: LocationDto, destination: LocationDto, requestedTime: Date, userId: string) {
        try {
            requestedTime = normalizeDate(requestedTime);

            return await this.requestRepository
                .createQueryBuilder('journey_request')
                .where("journey_request.origin->>'name' = :originName", { originName: origin.name })
                .andWhere("journey_request.destination->>'name' = :destinationName", { destinationName: destination.name })
                .andWhere("journey_request.requested_time = :requestedTime", { requestedTime })
                .andWhere("journey_request.userId = :userId", { userId })
                .getOne();
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException("Error finding repeated requests");
        }
    }

    async findAllPendingRequests() {
        return await this.requestRepository.find({
            where: {
                status: In([RequestStatus.PENDING, RequestStatus.OFFERED])
            },
            relations: ['user', 'user.profile'],
            select: {
                id: true,
                origin: true,
                destination: true,
                requestedTime: true,
                requestedSeats: true,
                packageWeight: true,
                packageLength: true,
                packageWidth: true,
                packageHeight: true,
                packageDescription: true,
                type: true,
                proposedPrice: true,
                status: true,
                createdAt: true,
                user: {
                    id: true,
                    name: true,
                    lastname: true,
                    profile: {
                        profileName: true
                    }
                }
            }
        });
    }

    async findMyRequests(id: string) {
        return await this.requestRepository.find({
            where: { user: { id } },
            relations: ['user', 'user.profile'],
            select: {
                id: true,
                origin: true,
                destination: true,
                requestedTime: true,
                requestedSeats: true,
                packageWeight: true,
                packageLength: true,
                packageWidth: true,
                packageHeight: true,
                packageDescription: true,
                type: true,
                proposedPrice: true,
                status: true,
                createdAt: true,
                user: {
                    id: true,
                    name: true,
                    lastname: true,
                    profile: {
                        profileName: true
                    }
                }
            }
        });
    }

    async cancelJourneyRequest(activeUserId: string, id: string) {
        try {
            const request = await this.requestRepository.findOne({ where: { id }, relations: ['user'] })

            if (!request) throw new NotFoundException("Request not found")

            if (request.user.id !== activeUserId) throw new ForbiddenException("User must be request owner")

            await this.requestRepository.update(id, {
                status: RequestStatus.CANCELLED
            })
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Error cancelling request")
        }
    }

    async cancelAllJourneyRequestsById(userId: string) {
        const requests = await this.requestRepository.find({
            where: {
                user: { id: userId },
                status: In([RequestStatus.PENDING, RequestStatus.OFFERED])
            }
        })

        if (!requests) throw new NotFoundException("Requests not found")

        for (const request of requests) {
            request.status = RequestStatus.CANCELLED
        }

        await this.requestRepository.save(requests)
    }
}
