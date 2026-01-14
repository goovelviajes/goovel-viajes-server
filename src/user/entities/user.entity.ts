import { Proposal } from 'src/proposal/entities/proposal.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Booking } from '../../booking/entities/booking.entity';
import { RolesEnum } from '../../common/enums/roles.enum';
import { JourneyRequest } from '../../journey-request/entities/journey-request.entity';
import { Journey } from '../../journey/entities/journey.entity';
import { Message } from '../../message/entities/message.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { Profile } from '../../profile/entities/profile.entity';
import { Rating } from '../../rating/entities/rating.entity';
import { Report } from '../../report/entities/report.entity';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  lastname: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ type: 'date', nullable: true })
  birthdate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ default: RolesEnum.MEMBER })
  role: RolesEnum;

  @Column({ default: false })
  isEmailConfirmed: boolean;

  @Column({ nullable: true, select: false })
  resetToken: string;

  @Column({ default: 0 })
  failedAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ default: false })
  isVerifiedUser: boolean;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ type: 'text', nullable: true })
  banReason: string;

  @Column({ type: 'timestamptz', nullable: true })
  bannedAt: Date | null;

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Report, (report) => report.reporter)
  sentReports: Report[];

  @OneToMany(() => Report, (report) => report.reported)
  receivedReports: Report[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.user)
  vehicles: Vehicle[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];

  @OneToMany(() => Journey, (journey) => journey.user)
  journeys: Journey[]

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Rating, (rating) => rating.raterUser)
  givenRatings: Rating[];

  @OneToMany(() => Rating, (rating) => rating.ratedUser)
  receivedRatings: Rating[];

  @OneToMany(() => JourneyRequest, (journeyRequest) => journeyRequest.user)
  journeyRequests: JourneyRequest[];

  @OneToMany(() => Proposal, (proposal) => proposal.driver)
  proposals: Proposal[];
}
