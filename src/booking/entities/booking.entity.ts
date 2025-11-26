import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BookingStatus } from "../enums/booking-status.enum";
import { User } from "../../user/entities/user.entity";
import { Journey } from "../../journey/entities/journey.entity";

@Entity()
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    seatCount: number;

    @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
    status: BookingStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column()
    isShipping: boolean;

    @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Journey, (journey) => journey.bookings, { onDelete: 'SET NULL' })
    journey: Journey;

}