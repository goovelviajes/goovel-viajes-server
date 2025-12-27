import { Journey } from "src/journey/entities/journey.entity";
import { User } from "../../user/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@Index(['journey', 'sender', 'receiver'])
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    content: string;

    @Column({ name: 'is_read', default: false })
    isRead: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.sentMessages, { onDelete: 'CASCADE' })
    sender: User;

    @ManyToOne(() => User, (user) => user.receivedMessages, { onDelete: 'CASCADE' })
    receiver: User;

    @ManyToOne(() => Journey, (journey) => journey.messages, { onDelete: 'CASCADE' })
    journey: Journey;
}