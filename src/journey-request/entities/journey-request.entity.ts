import { JourneyType } from "src/journey/enums/journey-type.enum";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RequestType } from "../enums/request-type.enum";
import { User } from "src/user/entities/user.entity";

@Entity()
export class JourneyRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'json' })
    origin: { name: string; lat: number; lng: number };

    @Column({ type: 'json' })
    destination: { name: string; lat: number; lng: number };

    @Column({ name: 'requested_time', type: 'timestamp' })
    requestedTime: Date;

    @Column({ name: 'requested_seats', type: 'int', default: 1 })
    requestedSeats: number;

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
        enum: RequestType,
        default: RequestType.PENDING,
    })
    status: RequestType;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.journeyRequests, { onDelete: 'CASCADE' })
    user: User;
}