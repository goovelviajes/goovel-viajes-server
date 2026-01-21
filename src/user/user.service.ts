import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { MailService } from '../mail/mail.service';
import { JourneyService } from '../journey/journey.service';
import { ProposalService } from '../proposal/proposal.service';
import { BookingService } from '../booking/booking.service';
import { forwardRef } from '@nestjs/common';
import { JourneyRequestService } from '../journey-request/journey-request.service';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => JourneyService)) private readonly journeyService: JourneyService,
    @Inject(forwardRef(() => JourneyRequestService)) private readonly journeyRequestService: JourneyRequestService,
    @Inject(forwardRef(() => ProposalService)) private readonly proposalService: ProposalService,
    @Inject(forwardRef(() => BookingService)) private readonly bookingService: BookingService
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const exists = await this.isUserAlreadyExists(createUserDto.email);

      if (exists) {
        this.logger.warn(`[USER_CREATE_CONFLICT] - Email already exists: ${createUserDto.email}`);
        throw new BadRequestException('Email is already existent');
      }

      const newUser = this.userRepository.create(createUserDto);

      return await this.userRepository.save(newUser);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`[USER_CREATE_ERROR] - Error creating user: ${error}`);
      throw new InternalServerErrorException('Error creating user');
    }

  }

  private async isUserAlreadyExists(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    return !!user;
  }

  async getUserByEmail(email: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'name', 'lastname', 'email', 'password', 'isEmailConfirmed', 'role', 'failedAttempts', 'lockedUntil'],
        withDeleted: true
      });

      return user;
    } catch (error) {
      this.logger.error(
        `[USER_GET_BY_EMAIL_ERROR] - Email: ${email} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error retrieving user data');
    }

  }

  async getUserById(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        withDeleted: true,
        select: [
          'id',
          'name',
          'lastname',
          'email',
          'birthdate',
          'password',
          'createdAt',
          'updatedAt',
          'deletedAt',
          'isEmailConfirmed',
          'role',
          'failedAttempts',
          'lockedUntil',
          'isVerifiedUser',
          'isBanned',
          'banReason',
          'bannedAt',
          'resetToken'
        ]
      });

      if (!user) {
        this.logger.warn(`[USER_NOT_FOUND] - ID: ${id}`);
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `[USER_GET_BY_ID_ERROR] - Id: ${id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error retrieving user data by id');
    }
  }

  async getUserByIdWithoutPassword(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        withDeleted: true,
        relations: ['profile'],
        select: [
          'id',
          'name',
          'lastname',
          'email',
          'birthdate',
          'createdAt',
          'updatedAt',
          'deletedAt',
          'role',
          'isEmailConfirmed',
          'profile'
        ]
      });

      if (!user) {
        this.logger.warn(`[USER_NOT_FOUND] - ID: ${id}`);
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `[USER_GET_BY_ID_ERROR] - ID: ${id} - Message: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error retrieving user profile');
    }

  }

  /**
   * Actualiza la información adicional del usuario, con datos específicos
   * que no se establecieron en el registro inicial (por ejemplo, datos de facturación).
   */
  async updateUserInformation(id: string, updateUserDto: UpdateUserDto): Promise<void> {
    try {
      const parsedDate = new Date(updateUserDto.birthdate + "T00:00:00");
      const isValidDate = !isNaN(parsedDate.getTime())

      if (updateUserDto.birthdate && !isValidDate) {
        this.logger.warn(`[USER_UPDATE_BAD_DATE] - ID: ${id} - Provided Date: ${updateUserDto.birthdate}`);
        throw new BadRequestException("Invalid date format")
      }

      const user = await this.userRepository.preload({
        id,
        ...updateUserDto,
        birthdate: updateUserDto.birthdate ? parsedDate : undefined
      });

      if (!user) {
        this.logger.warn(`[USER_UPDATE_NOT_FOUND] - Attempted to update non-existent user: ${id}`);
        throw new NotFoundException('User not found');
      }

      await this.userRepository.save(user);

      const updatedFields = Object.keys(updateUserDto).join(', ');
      this.logger.log(`[USER_UPDATE_SUCCESS] - ID: ${id} - Fields updated: ${updatedFields}`);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[USER_UPDATE_CRITICAL_ERROR] - ID: ${id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException("Error updating user information");
    }
  }

  async softDeleteUser(id: string) {
    try {
      const deleteUser = await this.userRepository.softDelete(id);

      if (deleteUser.affected === 0) {
        this.logger.warn(`[USER_DELETE_NOT_FOUND] - Attempted to delete non-existent ID: ${id}`);
        throw new NotFoundException('User not found')
      }

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[USER_SOFT_DELETE_CRITICAL_ERROR] - ID: ${id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException("Error soft deleting user")
    }
  }

  async restoreDeletedUser(id: string) {
    try {
      const restoredUser = await this.userRepository.restore(id);

      if (restoredUser.affected === 0) {
        this.logger.warn(`[USER_RESTORE_FAILED] - ID: ${id} - Reason: User not found or not deleted`);
        throw new NotFoundException('User not found or not in a deleted state');
      }

      this.logger.log(`[USER_RESTORE_SUCCESS] - User ID: ${id} has been successfully reactivated`);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[USER_RESTORE_CRITICAL_ERROR] - ID: ${id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException("Error restoring deleted user")
    }
  }

  async getUserByProfileName(profileName: string) {
    try {
      const user = await this.userRepository.createQueryBuilder('user')
        .innerJoin('user.profile', 'profile')
        .where('profile.profileName = :profileName', { profileName })
        .select(['user.id', 'user.name', 'user.lastname', 'user.birthdate', 'user.createdAt'])
        .getOne();

      if (!user) {
        this.logger.warn(`[USER_BY_PROFILE_NOT_FOUND] - ProfileName: ${profileName}`);
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[USER_BY_PROFILE_ERROR] - ProfileName: ${profileName} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error retrieving user by profile name');
    }

  }

  async update(id: string, user: User) {
    try {
      const userToBeUpdated = await this.userRepository.preload({
        id,
        ...user,
      });

      if (!userToBeUpdated) {
        throw new NotFoundException('User not found');
      }

      await this.userRepository.save(userToBeUpdated);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[USER_UPDATE_CRITICAL_ERROR] - ID: ${id} - Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error updating user');
    }
  }

  async markUserAsConfirmed(user: User) {
    try {
      if (user.isEmailConfirmed) {
        this.logger.warn(`[USER_CONFIRM_ALREADY_DONE] - User: ${user.email}`);
        throw new BadRequestException('User already confirmed');
      }

      user.isEmailConfirmed = true;
      const updatedUser = await this.userRepository.save(user);

      this.logger.log(`[USER_CONFIRM_SUCCESS] - Email: ${user.email} - ID: ${user.id}`);
      return updatedUser;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[USER_CONFIRM_CRITICAL_ERROR] - ID: ${user.id} - Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error confirming user email');
    }
  }

  async grantVerification(email: string, isVerifiedUser: boolean) {
    try {
      const user = await this.getUserByEmail(email);

      if (!user) {
        this.logger.warn(`[USER_VERIFICATION_FAILED] - User not found: ${email}`);
        throw new NotFoundException('User not found');
      }

      user.isVerifiedUser = isVerifiedUser;
      await this.userRepository.save(user);

      this.logger.log(
        `[USER_VERIFICATION_UPDATED] - Email: ${email} - Verified: ${isVerifiedUser}`
      );

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[USER_VERIFICATION_CRITICAL_ERROR] - Email: ${email} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error updating user verification status');
    }
  }

  async banUser(id: string, banReason: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        this.logger.warn(`[USER_BAN_FAILED] - User not found: ${id}`);
        throw new NotFoundException('User not found');
      }

      user.isBanned = true;
      user.banReason = banReason;
      user.bannedAt = new Date();

      const bannedUser = await this.userRepository.save(user);

      // Log de seguridad crítico
      this.logger.error(`[SECURITY_BAN] - User ID: ${id} - Email: ${user.email} - Reason: ${banReason}`);

      // Ejecución de cascada de cancelaciones
      await Promise.all([
        this.journeyService.cancelAllJourneysById(id),
        this.journeyRequestService.cancelAllJourneyRequestsById(id),
        this.bookingService.cancelAllBookingsById(id),
        this.proposalService.cancelAllProposalsById(id)
      ]).catch(err => {
        this.logger.error(`[USER_BAN_CASCADING_CANCEL_ERROR] - ID: ${id} - Error: ${err.message}`, err.stack);
      });

      await this.mailService.sendUserBannedEmail(
        bannedUser.email,
        bannedUser.name,
        bannedUser.lastname,
        banReason
      ).catch(err => {
        this.logger.error(`[USER_BAN_MAIL_ERROR] - Email: ${bannedUser.email} - Error: ${err.message}`, err.stack);
      });

      return bannedUser;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[USER_BAN_CRITICAL_ERROR] - ID: ${id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error during user ban process');
    }
  }

  async unbanUser(id: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        this.logger.warn(`[USER_UNBAN_FAILED] - User not found: ${id}`);
        throw new NotFoundException('User not found');
      }

      user.isBanned = false;
      user.banReason = null;
      user.bannedAt = null;

      await this.userRepository.save(user);

      this.logger.log(`[USER_UNBAN_SUCCESS] - User ID: ${id} - Email: ${user.email}`);

      return {
        id: user.id,
        isBanned: user.isBanned,
        banReason: user.banReason,
        bannedAt: user.bannedAt,
        message: 'User unbanned successfully'
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[USER_UNBAN_CRITICAL_ERROR] - ID: ${id} - Error: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException('Error during user unban process');
    }
  }
}
