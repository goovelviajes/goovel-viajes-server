import { ConflictException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, BadRequestException, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
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
    private readonly logger = new Logger(JourneyRequestService.name);

    constructor(
        @InjectRepository(JourneyRequest) private readonly requestRepository: Repository<JourneyRequest>,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService
    ) { }

    async createRequest({ id }: ActiveUserInterface, requestDto: CreateRequestDto) {
        try {
            this.validateFieldsByType(requestDto)

            const newRequest = this.requestRepository.create({
                ...requestDto,
                user: { id }
            })

            const isRequestRepeated = !!await this.findRepeatedRequests(requestDto.origin, requestDto.destination, requestDto.requestedTime, id)

            if (isRequestRepeated) {
                this.logger.warn(`[REQUEST_CREATE_REPEATED] - User: ${id} - Already has a request for this time/route`)
                throw new ConflictException("Request cannot be repeated")
            }

            const savedRequest = await this.requestRepository.save(newRequest);

            this.logger.log(`[REQUEST_CREATED] - ID: ${savedRequest.id} - User: ${id} - Type: ${requestDto.type}`);
            return savedRequest;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            this.logger.error(
                `[REQUEST_CREATE_CRITICAL_ERROR] - User: ${id} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error creating journey request");
        }

    }

    // Valida los campos especificos segun el tipo de viaje (CARPOOL o PACKAGE)
    private validateFieldsByType(requestDto: CreateRequestDto) {
        try {
            if (requestDto.type === JourneyType.PACKAGE) {
                if (requestDto.requestedSeats) {
                    this.logger.warn(`[REQUEST_VAL_FAILED] - Type PACKAGE with requestedSeats - Data: ${JSON.stringify(requestDto)}`);
                    throw new BadRequestException("requestedSeats field is not required for package journeys")
                }
            }

            if (requestDto.type === JourneyType.CARPOOL) {
                const hasPackageFields =
                    requestDto.packageWeight ||
                    requestDto.packageLength ||
                    requestDto.packageWidth ||
                    requestDto.packageHeight ||
                    requestDto.packageDescription;

                if (hasPackageFields) {
                    this.logger.warn(`[REQUEST_VAL_FAILED] - Type CARPOOL with package fields - Data: ${JSON.stringify(requestDto)}`);
                    throw new BadRequestException("Package related fields are not required for carpool journeys");
                }
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[REQUEST_VAL_CRITICAL_ERROR] - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error validating request fields");
        }

    }

    private async findRepeatedRequests(origin: LocationDto, destination: LocationDto, requestedTime: Date, userId: string) {
        try {
            const normalizedTime = normalizeDate(requestedTime);

            return await this.requestRepository
                .createQueryBuilder('journey_request')
                .where("journey_request.origin->>'name' = :originName", { originName: origin.name })
                .andWhere("journey_request.destination->>'name' = :destinationName", { destinationName: destination.name })
                .andWhere("journey_request.requested_time = :requestedTime", { requestedTime: normalizedTime })
                .andWhere("journey_request.userId = :userId", { userId })
                .getOne();
        } catch (error) {
            this.logger.error(
                `[REQUEST_FIND_REPEATED_ERROR] - User: ${userId} - Origin: ${origin.name} - Dest: ${destination.name} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error finding repeated requests");
        }
    }

    async findAllPendingRequests() {
        try {
            const requests = await this.requestRepository.find({
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

            this.logger.log(`[REQUEST_FIND_ALL_PENDING] - Found ${requests.length} active requests`);
            return requests;
        } catch (error) {
            this.logger.error(
                `[REQUEST_FIND_ALL_ERROR] - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException('Error retrieving pending journey requests');
        }
    }

    async findMyRequests(id: string) {
        try {
            const requests = await this.requestRepository.find({
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

            this.logger.log(`[REQUEST_FIND_MY_REQUESTS] - Found ${requests.length} requests`);
            return requests;
        } catch (error) {
            this.logger.error(
                `[REQUEST_FIND_MY_REQUESTS_ERROR] - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException('Error retrieving my requests');
        }

    }

    async cancelJourneyRequest(activeUserId: string, id: string) {
        try {
            const request = await this.requestRepository.findOne({ where: { id }, relations: ['user'] })

            if (!request) {
                this.logger.warn(`[REQUEST_CANCEL_NOT_FOUND] - ID: ${id} - User: ${activeUserId}`);
                throw new NotFoundException("Request not found")
            }

            if (request.user.id !== activeUserId) {
                this.logger.warn(`[REQUEST_CANCEL_FORBIDDEN] - User ${activeUserId} attempted to cancel request ${id} owned by ${request.user.id}`);
                throw new ForbiddenException("User must be request owner")
            }

            await this.requestRepository.update(id, {
                status: RequestStatus.CANCELLED
            })

            this.logger.log(`[REQUEST_CANCELLED_SUCCESS] - ID: ${id} - User: ${activeUserId}`);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            this.logger.error(
                `[REQUEST_CANCEL_CRITICAL_ERROR] - ID: ${id} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error cancelling request")
        }
    }

    async cancelAllJourneyRequestsById(userId: string) {
        try {
            const requests = await this.requestRepository.find({
                where: {
                    user: { id: userId },
                    status: In([RequestStatus.PENDING, RequestStatus.OFFERED])
                }
            })

            if (!requests || requests.length === 0) {
                this.logger.log(`[REQUEST_CANCEL_ALL_NONE] - No active requests found for User: ${userId}`);
                return;
            }

            for (const request of requests) {
                request.status = RequestStatus.CANCELLED
            }

            await this.requestRepository.save(requests)

            this.logger.log(
                `[REQUEST_CANCEL_ALL_SUCCESS] - User: ${userId} - Total cancelled: ${requests.length}`
            );
        } catch (error) {
            this.logger.error(
                `[REQUEST_CANCEL_ALL_ERROR] - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error cancelling all user requests");
        }

    }
}
