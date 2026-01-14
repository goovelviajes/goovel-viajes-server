import { Proposal } from "src/proposal/entities/proposal.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { JourneyType } from "../../journey/enums/journey-type.enum";
import { User } from "../../user/entities/user.entity";
import { RequestStatus } from "../enums/request-status.enum";

@Entity()
export class JourneyRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'jsonb' })
    origin: { name: string; lat: number; lng: number };

    @Column({ type: 'jsonb' })
    destination: { name: string; lat: number; lng: number };

    @Column({
        name: 'requested_time',
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP'
    })
    requestedTime: Date;

    @Column({ name: 'requested_seats', type: 'int', default: 1, nullable: true })
    requestedSeats?: number;

    @Column({
        name: 'proposed_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    proposedPrice?: number;

    @Column({ type: 'enum', enum: JourneyType })
    type: JourneyType;

    @Column({
        type: 'enum',
        enum: RequestStatus,
        default: RequestStatus.PENDING,
    })
    status: RequestStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'decimal', nullable: true, name: 'package_weight' })
    packageWeight?: number;

    @Column({ type: 'decimal', nullable: true, name: 'package_length' })
    packageLength?: number;

    @Column({ type: 'decimal', nullable: true, name: 'package_width' })
    packageWidth?: number;

    @Column({ type: 'decimal', nullable: true, name: 'package_height' })
    packageHeight?: number;

    @Column({ nullable: true, name: 'package_description' })
    packageDescription?: string;

    @ManyToOne(() => User, (user) => user.journeyRequests, { onDelete: 'CASCADE' })
    user: User;

    @OneToMany(() => Proposal, (proposal) => proposal.journeyRequest)
    proposals: Proposal[];
}