import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class TermsVersion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    versionNumber: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;
}