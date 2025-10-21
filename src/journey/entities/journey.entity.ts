import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { JourneyType } from "../enums/journey-type.enum";
import { User } from "src/user/entities/user.entity";
import { Vehicle } from "src/vehicle/entities/vehicle.entity";
import { JourneyStatus } from "../enums/journey-status.enum";
import { Booking } from "src/booking/entities/booking.entity";
import { Rating } from "src/rating/entities/rating.entity";

@Entity()
export class Journey {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'json' })
    origin: { name: string; lat: number; lng: number };

    @Column({ type: 'json' })
    destination: { name: string; lat: number; lng: number };

    @Column({ name: 'departure_time', type: 'timestamp' })
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
}