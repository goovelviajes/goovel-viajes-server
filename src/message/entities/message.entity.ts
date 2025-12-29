import { Journey } from "src/journey/entities/journey.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../user/entities/user.entity";

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

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;

    @ManyToOne(() => User, (user) => user.sentMessages, { onDelete: 'CASCADE' })
    sender: User;

    @ManyToOne(() => User, (user) => user.receivedMessages, { onDelete: 'CASCADE' })
    receiver: User;

    @ManyToOne(() => Journey, (journey) => journey.messages, { onDelete: 'CASCADE' })
    journey: Journey;
}