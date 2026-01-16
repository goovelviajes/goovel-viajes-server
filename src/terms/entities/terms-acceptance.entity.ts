import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { TermsVersion } from './terms-version.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class TermsAcceptance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    versionId: string;

    @CreateDateColumn()
    acceptedAt: Date;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => TermsVersion)
    version: TermsVersion;
}