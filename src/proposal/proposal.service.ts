import { BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Booking } from '../booking/entities/booking.entity';
import { BookingStatus } from '../booking/enums/booking-status.enum';
import { JourneyRequest } from '../journey-request/entities/journey-request.entity';
import { RequestStatus } from '../journey-request/enums/request-status.enum';
import { Journey } from '../journey/entities/journey.entity';
import { JourneyStatus } from '../journey/enums/journey-status.enum';
import { JourneyType } from '../journey/enums/journey-type.enum';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { CreateProposalDto } from './dtos/create-proposal.dto';
import { Proposal } from './entities/proposal.entity';
import { ProposalStatus } from './enums/proposal-status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { JourneyService } from '../journey/journey.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ProposalService {
    private readonly logger = new Logger(ProposalService.name);

    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Proposal)
        private readonly proposalRepository: Repository<Proposal>,
        private readonly journeyService: JourneyService
    ) { }

    /**
   * ACCIÓN CONDUCTOR: Crear una oferta para un viaje
   */
    async createProposal(driverId: string, dto: CreateProposalDto) {
        try {
            return await this.dataSource.transaction(async (manager) => {
                // 1. Buscar la solicitud (Journey Request)
                const request = await manager.findOne(JourneyRequest, {
                    where: { id: dto.requestId }
                })

                if (!request) {
                    this.logger.warn(`[PROPOSAL_CREATE_NOT_FOUND] - Request: ${dto.requestId}`);
                    throw new NotFoundException("Journey request not found");
                }

                const invalidStatuses = [RequestStatus.MATCHED, RequestStatus.CLOSED, RequestStatus.CANCELLED];
                if (invalidStatuses.includes(request.status)) {
                    this.logger.warn(`[PROPOSAL_CREATE_INVALID_STATUS] - Request: ${request.id} is ${request.status}`);
                    throw new ConflictException("Only a journey request with pending status can be matched");
                }

                if (new Date() > request.requestedTime) {
                    this.logger.warn(`[PROPOSAL_CREATE_EXPIRED] - Request time ${request.requestedTime} has passed`);
                    throw new ConflictException("Cannot propose for a journey that has already departed");
                }

                // 2. Buscar el vehiculo (propiedad y capacidad)
                const vehicle = await manager.findOne(Vehicle, {
                    where: { id: dto.vehicleId },
                    relations: { user: true },
                    select: { user: { id: true } }
                })

                if (!vehicle) throw new NotFoundException("Vehicle not found");

                if (vehicle.user.id !== driverId) {
                    this.logger.warn(`[PROPOSAL_CREATE_FORBIDDEN] - Driver ${driverId} tried to use vehicle ${vehicle.id} of user ${vehicle.user.id}`)
                    throw new ForbiddenException("User must be vehicle owner");
                }

                if (vehicle.capacity < request.requestedSeats) throw new BadRequestException("Vehicle capacity is not enough");

                // 3. Verificar si este conductor ya ofertó para este request (Evitar spam)
                const existingProposal = await manager.findOne(Proposal, {
                    where: {
                        journeyRequest: { id: dto.requestId },
                        driver: { id: driverId },
                        status: ProposalStatus.SENT
                    }
                })

                if (existingProposal) {
                    this.logger.warn(`[PROPOSAL_CREATE_DUPLICATE] - Driver ${driverId} already sent a proposal for request ${dto.requestId}`);
                    throw new ConflictException("Driver already proposed for this request");
                }

                const driver = await manager.findOne(User, { where: { id: driverId }, select: ['id'] });

                // 4. Crear la propuesta
                const newProposal = manager.create(Proposal, {
                    journeyRequest: request,
                    driver,
                    vehicle: {
                        id: dto.vehicleId,
                        brand: vehicle.brand,
                        model: vehicle.model,
                        capacity: vehicle.capacity,
                        color: vehicle.color,
                        plate: vehicle.plate,
                        type: vehicle.type,
                        year: vehicle.year,
                    },
                    priceOffered: request.proposedPrice,
                    status: ProposalStatus.SENT
                })

                const savedProposal = await manager.save(newProposal);

                // 5. Actualizar el estado de la solicitud
                request.status = RequestStatus.OFFERED;
                await manager.save(request);

                this.logger.log(`[PROPOSAL_CREATED_SUCCESS] - ID: ${savedProposal.id} - Driver: ${driverId} - Request: ${request.id}`);
                return savedProposal;
            })
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[PROPOSAL_CREATE_CRITICAL_ERROR] - Driver: ${driverId} - Request: ${dto.requestId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error creating proposal");
        }
    }

    /**
       * ACCIÓN PASAJERO: Aceptar una oferta (TRANSACCIÓN CRÍTICA)
       */
    async acceptProposal(passengerId: string, proposalId: string) {
        return await this.dataSource.transaction(async (manager) => {
            try {
                // 1. Buscar y BLOQUEAR la Propuesta
                // Usamos pessimistic_write para que nadie la modifique mientras decidimos
                const proposal = await manager.findOne(Proposal, {
                    where: { id: proposalId },
                    relations: ['journeyRequest', 'vehicle', 'driver', 'journeyRequest.user'],
                    lock: { mode: 'pessimistic_write' },
                });

                if (!proposal) {
                    this.logger.warn(`[PROPOSAL_ACCEPT_NOT_FOUND] - ID: ${proposalId}`);
                    throw new NotFoundException('Proposal not found');
                }

                // 2. Validaciones de seguridad
                const request = proposal.journeyRequest;

                // Verificar que quien acepta es el dueño del request
                if (request.user.id !== passengerId) {
                    this.logger.warn(`[PROPOSAL_ACCEPT_FORBIDDEN] - User ${passengerId} tried to accept proposal ${proposalId} for request ${request.id} owned by ${request.user.id}`);
                    throw new ForbiddenException('You do not have permission to accept this proposal.');
                }

                // Verificar que la propuesta esté vigente
                if (proposal.status !== ProposalStatus.SENT) {
                    this.logger.warn(`[PROPOSAL_ACCEPT_INVALID_STATUS] - Proposal: ${proposalId} Status: ${proposal.status}`);
                    throw new ConflictException(`Cannot accept this proposal because it is in state ${proposal.status}`);
                }

                // Verificar que el request siga abierto
                if (request.status === RequestStatus.CLOSED) {
                    this.logger.warn(`[PROPOSAL_ACCEPT_REQUEST_CLOSED] - Request: ${request.id} is already CLOSED`);
                    throw new ConflictException('Your journey request has already been closed.');
                }

                // 3. Crear el VIAJE (Journey)
                const newJourney = manager.create(Journey, {
                    user: { id: proposal.driver.id },
                    acceptedProposal: proposal,
                    origin: request.origin,
                    destination: request.destination,
                    departureTime: request.requestedTime,
                    status: JourneyStatus.PENDING,
                    vehicle: proposal.vehicle,
                    availableSeats: (proposal.vehicle.capacity - request.requestedSeats),
                    isShipping: request.type === JourneyType.PACKAGE,
                    pricePerSeat: request.proposedPrice,
                    totalAmount: request.proposedPrice * request.requestedSeats,
                });
                const savedJourney = await manager.save(newJourney);

                // 4. Crear la RESERVA (Booking) para el pasajero
                const newBooking = manager.create(Booking, {
                    journey: savedJourney,
                    user: { id: passengerId },
                    seatCount: request.requestedSeats,
                    status: BookingStatus.CONFIRMED,
                    price: request.proposedPrice,
                    isShipping: request.type === JourneyType.PACKAGE,
                });
                await manager.save(newBooking);

                // 5. Actualizar Estados
                proposal.status = ProposalStatus.ACCEPTED;
                await manager.save(proposal);

                request.status = RequestStatus.CLOSED;
                await manager.save(request);

                // 6. Rechazar las demás propuestas
                const rejectionResult = await manager.update(Proposal,
                    { journeyRequest: { id: request.id }, status: ProposalStatus.SENT },
                    { status: ProposalStatus.REJECTED }
                );

                this.logger.log(`[PROPOSAL_ACCEPTED_SUCCESS] - Journey: ${savedJourney.id} created from Proposal: ${proposal.id}. Other proposals rejected: ${rejectionResult.affected}`);
                return { message: 'Journey confirmed successfully', journeyId: savedJourney.id };
            } catch (error) {
                if (error instanceof HttpException) throw error;

                this.logger.error(
                    `[PROPOSAL_ACCEPT_CRITICAL_ERROR] - Proposal: ${proposalId} - Passenger: ${passengerId} - Error: ${error.message}`,
                    error.stack
                );
                throw new InternalServerErrorException("Error during proposal acceptance transaction");
            }
        });
    }

    /**
   * ACCIÓN PASAJERO: Rechazar una oferta
   */
    async rejectProposal(passengerId: string, proposalId: string) {
        try {
            // No necesitamos una transacción pesada aquí, es una actualización simple
            const proposal = await this.dataSource.getRepository(Proposal).findOne({
                where: { id: proposalId },
                relations: ['journeyRequest', 'journeyRequest.user']
            });

            if (!proposal) {
                this.logger.warn(`[PROPOSAL_REJECT_NOT_FOUND] - ID: ${proposalId} - User: ${passengerId}`);
                throw new NotFoundException('Proposal not found');
            }

            if (proposal.journeyRequest.user.id !== passengerId) {
                this.logger.warn(`[PROPOSAL_REJECT_FORBIDDEN] - User ${passengerId} tried to reject proposal ${proposalId} belonging to user ${proposal.journeyRequest.user.id}`);
                throw new ForbiddenException('You do not have permission to reject this proposal.');
            }

            if (proposal.status !== ProposalStatus.SENT) {
                this.logger.warn(`[PROPOSAL_REJECT_INVALID_STATUS] - Proposal: ${proposalId} is ${proposal.status}`);
                throw new ConflictException('Only pending proposals can be rejected.');
            }

            proposal.status = ProposalStatus.REJECTED;
            const updatedProposal = await this.proposalRepository.save(proposal);

            this.logger.log(`[PROPOSAL_REJECTED_SUCCESS] - Proposal: ${proposalId} rejected by Passenger: ${passengerId}`);

            return updatedProposal;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[PROPOSAL_REJECT_ERROR] - Proposal: ${proposalId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error rejecting proposal");
        }
    }

    async getPendingProposals(userId: string) {
        try {
            const proposals = await this.proposalRepository.find({
                where: [
                    {
                        journeyRequest: { user: { id: userId } },
                        status: ProposalStatus.SENT
                    },
                    {
                        driver: { id: userId },
                        status: ProposalStatus.SENT
                    }
                ],
                relations: ['journeyRequest', 'vehicle', 'driver', 'driver.profile', 'journeyRequest.user']
            });

            this.logger.log(`[PROPOSAL_FETCH_PENDING] - User: ${userId} - Found: ${proposals.length}`);
            return proposals;
        } catch (error) {
            this.logger.error(
                `[PROPOSAL_FETCH_ERROR] - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException('Error retrieving pending proposals');
        }
    }

    async getRejectedAndCancelledProposals(userId: string) {
        try {
            const proposals = await this.proposalRepository.find({
                where:
                    [
                        {
                            journeyRequest: { user: { id: userId } },
                            status: In([ProposalStatus.REJECTED, ProposalStatus.CANCELLED])
                        },
                        {
                            driver: { id: userId },
                            status: In([ProposalStatus.REJECTED, ProposalStatus.CANCELLED])
                        }
                    ],
                relations: ['journeyRequest', 'vehicle', 'driver', 'driver.profile', 'journeyRequest.user'],
                order: { createdAt: 'DESC' }
            })

            this.logger.log(`[PROPOSAL_FETCH_HISTORY] - User: ${userId} - Found: ${proposals.length} inactive proposals`);
            return proposals;
        } catch (error) {
            this.logger.error(
                `[PROPOSAL_HISTORY_ERROR] - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException('Error retrieving proposal history');
        }
    }

    async getDriverProposals(driverId: string, status?: ProposalStatus | ProposalStatus[]) {
        try {
            const where: FindOptionsWhere<Proposal> = {
                driver: { id: driverId }
            };

            if (status) {
                where.status = Array.isArray(status) ? In(status) : status;
            }

            const proposals = await this.proposalRepository.find({
                where,
                relations: ['journeyRequest', 'vehicle', 'journeyRequest.user'],
                order: { createdAt: 'DESC' }
            });

            this.logger.log(
                `[PROPOSAL_FETCH_DRIVER] - Driver: ${driverId} - Status Filter: ${status || 'NONE'} - Count: ${proposals.length}`
            );

            return proposals;
        } catch (error) {
            this.logger.error(
                `[PROPOSAL_FETCH_DRIVER_ERROR] - Driver: ${driverId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException('Error retrieving driver proposals');
        }
    }

    async cancelProposal(driverId: string, proposalId: string) {
        try {
            const proposal = await this.proposalRepository.findOne({
                where: { id: proposalId, driver: { id: driverId } },
                relations: ['journeyRequest', 'vehicle', 'driver', 'journeyRequest.user']
            })

            if (!proposal) {
                this.logger.warn(`[PROPOSAL_CANCEL_NOT_FOUND] - ID: ${proposalId} - Driver: ${driverId}`);
                throw new NotFoundException('Proposal not found');
            }

            if (proposal.status !== ProposalStatus.SENT) {
                this.logger.warn(`[PROPOSAL_CANCEL_INVALID_STATUS] - Proposal: ${proposalId} is already ${proposal.status}`);
                throw new ConflictException('Only pending proposals can be cancelled.');
            }

            proposal.status = ProposalStatus.CANCELLED;
            const savedProposal = await this.proposalRepository.save(proposal);

            this.logger.log(`[PROPOSAL_CANCELLED_SUCCESS] - Proposal: ${proposalId} - Driver: ${driverId}`);
            return savedProposal;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[PROPOSAL_CANCEL_ERROR] - ID: ${proposalId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException('Error cancelling proposal');

        }

    }

    async cancelAllProposalsById(userId: string) {
        try {
            const proposals = await this.proposalRepository.find({
                where: {
                    journeyRequest: { user: { id: userId } },
                    status: ProposalStatus.SENT
                },
                relations: ['journeyRequest', 'journeyRequest.user']
            });

            if (!proposals || proposals.length === 0) {
                this.logger.log(`[PROPOSAL_CANCEL_ALL_NONE] - No active proposals for User: ${userId}`);
                return;
            }

            for (const proposal of proposals) {
                proposal.status = ProposalStatus.CANCELLED;

                this.journeyService.emitEvent({
                    usersId: [proposal.journeyRequest.user.id],
                    journeyId: proposal.journeyRequest.id,
                    type: 'proposal_cancelled',
                    reason: `El pasajero ${proposal.journeyRequest.user.name} ${proposal.journeyRequest.user.lastname} ha cancelado su propuesta.`
                })
            }

            await this.proposalRepository.save(proposals);

            this.logger.log(
                `[PROPOSAL_CANCEL_ALL_SUCCESS] - User: ${userId} - Total proposals cancelled: ${proposals.length}`
            );
        } catch (error) {
            this.logger.error(
                `[PROPOSAL_CANCEL_ALL_ERROR] - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error cancelling all user proposals");

        }

    }
}
