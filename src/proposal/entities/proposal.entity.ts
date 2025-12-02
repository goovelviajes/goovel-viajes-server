import { JourneyRequest } from "src/journey-request/entities/journey-request.entity";
import { User } from "src/user/entities/user.entity";
import { Vehicle } from "src/vehicle/entities/vehicle.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProposalStatus } from "../enums/proposal-status.enum";
import { Journey } from "src/journey/entities/journey.entity";

@Entity()
export class Proposal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: ProposalStatus, default: ProposalStatus.SENT })
    status: ProposalStatus;

    @CreateDateColumn()
    createdAt: Date;

    @Column('decimal', { precision: 10, scale: 2 })
    priceOffered: number;

    @ManyToOne(() => JourneyRequest, (journeyRequest) => journeyRequest.proposals)
    @JoinColumn({ name: 'journey_request_id' })
    journeyRequest: JourneyRequest;

    @ManyToOne(() => Vehicle, (vehicle) => vehicle.proposals)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @ManyToOne(() => User, (user) => user.proposals)
    @JoinColumn({ name: 'driver_id' })
    driver: User;

    @OneToOne(() => Journey, (journey) => journey.acceptedProposal)
    journey: Journey;
}