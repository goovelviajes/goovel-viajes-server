
// import { AuthProvider } from 'src/auth/enums/auth-provider.enum';
import { Notification } from 'src/notification/entities/notification.entity';
import { Profile } from 'src/profile/entities/profile.entity';
import { Report } from 'src/report/entities/report.entity';
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
import { RolesEnum } from '../enums/roles.enum';
import { Message } from 'src/message/entities/message.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Journey } from 'src/journey/entities/journey.entity';
import { Booking } from 'src/booking/entities/booking.entity';
import { Rating } from 'src/rating/entities/rating.entity';
import { JourneyRequest } from 'src/journey-request/entities/journey-request.entity';

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

  @Column({ nullable: true })
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

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Report, (report) => report.user)
  reports: Report[];

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

  // ---> Habilitar para Google:
  // @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  // provider: AuthProvider;

  // @Column({ nullable: true })
  // googleId?: string;
}
