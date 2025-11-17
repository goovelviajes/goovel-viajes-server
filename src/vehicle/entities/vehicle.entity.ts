import { User } from "../../user/entities/user.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { VehicleType } from "../enums/vehicle-type.enum";
import { Journey } from "../../journey/entities/journey.entity";

@Entity()
export class Vehicle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    brand: string;

    @Column()
    model: string;

    @Column()
    capacity: number;

    @Column()
    color: string;

    @Column({ unique: true })
    plate: string;

    @Column({ type: 'enum', enum: VehicleType })
    type: VehicleType;

    @Column({ type: 'int', width: 4 })
    year: number;

    @ManyToOne(() => User, (user) => user.vehicles, { onDelete: 'CASCADE' })
    user: User;

    @OneToMany(() => Journey, (journey) => journey.vehicle)
    journeys: Journey[];
}