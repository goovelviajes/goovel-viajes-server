import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { ReportReason } from "../enums/report-reason.enum";
import { ReportStatus } from "../enums/report-status.enum";

@Entity()
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ReportReason,
    })
    reason: ReportReason;

    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({
        type: 'enum',
        enum: ReportStatus,
        default: ReportStatus.PENDING,
    })
    status: ReportStatus;

    @ManyToOne(() => User, (user) => user.sentReports, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reporter_id' })
    reporter: User;

    @ManyToOne(() => User, (user) => user.receivedReports, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reported_id' })
    reported: User;
}