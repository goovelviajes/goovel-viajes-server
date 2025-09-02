import { User } from "src/user/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { VehicleType } from "../enums/vehicle-type.enum";

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

    @Column({ type: 'enum', enum: VehicleType })
    type: VehicleType;

    @Column({ type: 'int', width: 4 })
    year: number;

    @ManyToOne(() => User, (user) => user.vehicles, { onDelete: 'CASCADE' })
    user: User;
}