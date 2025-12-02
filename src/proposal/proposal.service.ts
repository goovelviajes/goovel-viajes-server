import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Booking } from 'src/booking/entities/booking.entity';
import { BookingStatus } from 'src/booking/enums/booking-status.enum';
import { JourneyRequest } from 'src/journey-request/entities/journey-request.entity';
import { RequestStatus } from 'src/journey-request/enums/request-status.enum';
import { Journey } from 'src/journey/entities/journey.entity';
import { JourneyStatus } from 'src/journey/enums/journey-status.enum';
import { JourneyType } from 'src/journey/enums/journey-type.enum';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { DataSource } from 'typeorm';
import { CreateProposalDto } from './dtos/create-proposal.dto';
import { Proposal } from './entities/proposal.entity';
import { ProposalStatus } from './enums/proposal-status.enum';

@Injectable()
export class ProposalService {
    constructor(private readonly dataSource: DataSource) { }

    /**
   * ACCIÓN CONDUCTOR: Crear una oferta para un viaje
   */
    async createProposal(driverId: string, dto: CreateProposalDto) {
        return await this.dataSource.transaction(async (manager) => {
            // 1. Buscar la solicitud (Journey Request)
            const request = await manager.findOne(JourneyRequest, {
                where: { id: dto.requestId }
            })

            if (!request) throw new NotFoundException("Journey request not found");

            if (
                request.status === RequestStatus.MATCHED ||
                request.status === RequestStatus.CLOSED ||
                request.status === RequestStatus.CANCELLED
            ) throw new ConflictException("Only a journey request with pending status can be matched");

            if (new Date() > request.requestedTime) throw new ConflictException("Cannot propose for a journey that has already departed");

            // 2. Buscar el vehiculo (propiedad y capacidad)
            const vehicle = await manager.findOne(Vehicle, {
                where: { id: dto.vehicleId },
                relations: { user: true }
            })

            if (!vehicle) throw new NotFoundException("Vehicle not found");
            if (vehicle.user.id !== driverId) throw new ForbiddenException("User must be vehicle owner");
            if (vehicle.capacity < request.requestedSeats) throw new BadRequestException("Vehicle capacity is not enough");

            // 3. Verificar si este conductor ya ofertó para este request (Evitar spam)
            const existingProposal = await manager.findOne(Proposal, {
                where: { journeyRequest: { id: dto.requestId }, driver: { id: driverId }, status: ProposalStatus.SENT }
            })

            if (existingProposal) throw new ConflictException("Driver already proposed for this request");

            // 4. Crear la propuesta
            const newProposal = manager.create(Proposal, {
                journeyRequest: request,
                driver: { id: driverId },
                vehicle,
                priceOffered: request.proposedPrice,
                status: ProposalStatus.SENT
            })

            await manager.save(newProposal);

            // 5. Actualizar el estado de la solicitud
            request.status = RequestStatus.OFERED;
            await manager.save(request);

            return newProposal;
        })
    }

    /**
       * ACCIÓN PASAJERO: Aceptar una oferta (TRANSACCIÓN CRÍTICA)
       */
    async acceptProposal(passengerId: string, proposalId: string) {
        return await this.dataSource.transaction(async (manager) => {

            // 1. Buscar y BLOQUEAR la Propuesta
            // Usamos pessimistic_write para que nadie la modifique mientras decidimos
            const proposal = await manager.findOne(Proposal, {
                where: { id: proposalId },
                relations: ['journeyRequest', 'vehicle', 'driver', 'journeyRequest.user'],
                lock: { mode: 'pessimistic_write' },
            });

            if (!proposal) throw new NotFoundException('Proposal not found');

            // 2. Validaciones de seguridad
            const request = proposal.journeyRequest;

            // Verificar que quien acepta es el dueño del request
            if (request.user.id !== passengerId) {
                throw new ForbiddenException('You do not have permission to accept this proposal.');
            }

            // Verificar que la propuesta esté vigente
            if (proposal.status !== ProposalStatus.SENT) {
                throw new ConflictException(`Cannot accept this proposal because it is in state ${proposal.status}`);
            }

            // Verificar que el request siga abierto
            if (request.status === RequestStatus.CLOSED) {
                throw new ConflictException('Your journey request has already been closed.');
            }

            // 3. Crear el VIAJE (Journey)
            const newJourney = manager.create(Journey, {
                user: { id: proposal.driver.id },
                acceptedProposal: proposal,
                origin: request.origin,
                destination: request.destination,
                departureTime: request.requestedTime,
                status: JourneyStatus.SCHEDULED,
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
            await manager.update(Proposal,
                { journeyRequest: { id: request.id }, status: ProposalStatus.SENT },
                { status: ProposalStatus.REJECTED }
            );

            return { message: 'Journey confirmed successfully', journeyId: savedJourney.id };
        });
    }
}
