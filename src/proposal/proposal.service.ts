import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateProposalDto } from './dtos/create-proposal.dto';
import { Proposal } from './entities/proposal.entity';
import { ProposalStatus } from './enums/proposal-status.enum';
import { JourneyRequest } from 'src/journey-request/entities/journey-request.entity';
import { RequestType } from 'src/journey-request/enums/request-type.enum';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { CLIENT_RENEG_LIMIT } from 'tls';

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
                request.status === RequestType.MATCHED ||
                request.status === RequestType.CLOSED ||
                request.status === RequestType.CANCELLED
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
            request.status = RequestType.OFERED;
            await manager.save(request);

            return newProposal;
        })
    }
}
