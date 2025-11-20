import { Journey } from "../../journey/entities/journey.entity";
import { User } from "../../user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Rating {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    rating: Number;

    @Column()
    comment: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Journey, (journey) => journey.ratings, { onDelete: 'CASCADE' })
    journey: Journey;

    @ManyToOne(() => User, (user) => user.givenRatings, { onDelete: 'CASCADE' })
    raterUser: User;

    @ManyToOne(() => User, (user) => user.receivedRatings, { onDelete: 'CASCADE' })
    ratedUser: User;
}