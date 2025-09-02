import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BookingStatus } from "../enums/booking-status.enum";
import { User } from "src/user/entities/user.entity";
import { Journey } from "src/journey/entities/journey.entity";

@Entity()
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    seatCount: number;

    @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
    status: BookingStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column()
    isShipping: boolean;

    @Column({ type: 'double', nullable: true })
    weight: number;

    @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Journey, (journey) => journey.bookings, { onDelete: 'SET NULL' })
    journey: Journey;

}