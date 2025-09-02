
// import { AuthProvider } from 'src/auth/enums/auth-provider.enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { RolesEnum } from '../enums/roles.enum';
import { Profile } from 'src/profile/entities/profile.entity';

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

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  // ---> Habilitar para Google:
  // @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  // provider: AuthProvider;

  // @Column({ nullable: true })
  // googleId?: string;
}
