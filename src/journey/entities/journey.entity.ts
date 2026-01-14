import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { JourneyType } from "../enums/journey-type.enum";
import { User } from "../../user/entities/user.entity";
import { Vehicle } from "../../vehicle/entities/vehicle.entity";
import { JourneyStatus } from "../enums/journey-status.enum";
import { Booking } from "../../booking/entities/booking.entity";
import { Rating } from "../../rating/entities/rating.entity";
import { Proposal } from "src/proposal/entities/proposal.entity";
import { Message } from "src/message/entities/message.entity";

@Entity()
export class Journey {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'jsonb' })
    origin: { name: string; lat: number; lng: number };

    @Column({ type: 'jsonb' })
    destination: { name: string; lat: number; lng: number };

    @Column({ name: 'departure_time', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    departureTime: Date;

    @Column({ name: 'available_seats', nullable: true })
    availableSeats: number;

    @Column({ name: 'price_per_seat', type: 'decimal', precision: 10, scale: 2, nullable: true })
    pricePerSeat: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'enum', enum: JourneyType })
    type: JourneyType;

    @Column({ type: 'enum', enum: JourneyStatus, default: JourneyStatus.PENDING })
    status: JourneyStatus;

    @ManyToOne(() => User, (user) => user.journeys, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Vehicle, (vehicle) => vehicle.journeys, { onDelete: 'CASCADE' })
    vehicle: Vehicle;

    @OneToMany(() => Booking, (booking) => booking.journey)
    bookings: Booking[];

    @OneToMany(() => Rating, (rating) => rating.journey)
    ratings: Rating[];

    @OneToMany(() => Message, (message) => message.journey)
    messages: Message[];

    // 🔹 RELACIÓN 1:1 CON PROPUESTA (proposal)
    // Este Journey nació de ESTA propuesta aceptada.
    // @JoinColumn indica que la columna 'accepted_proposal_id' existirá en esta tabla 'journey'.
    @OneToOne(() => Proposal, (proposal) => proposal.journey)
    @JoinColumn({ name: 'accepted_proposal_id' })
    acceptedProposal: Proposal;
}