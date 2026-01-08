import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const exists = await this.isUserAlreadyExists(createUserDto.email);

    if (exists) {
      throw new BadRequestException('Email is already existent');
    }

    const newUser = this.userRepository.create(createUserDto);

    return await this.userRepository.save(newUser);
  }

  private async isUserAlreadyExists(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    return !!user;
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'name', 'lastname', 'email', 'password', 'isEmailConfirmed', 'role', 'failedAttempts', 'lockedUntil'],
      withDeleted: true
    });

    return user;
  }

  async getUserById(id: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id }, withDeleted: true });


      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error trying to get user by id');
    }
  }

  async getUserByIdWithoutPassword(id: string) {
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
      throw new NotFoundException('User not found');
    }

    return user;
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
        throw new BadRequestException("Invalid date format")
      }

      const user = await this.userRepository.preload({
        id,
        ...updateUserDto,
        birthdate: updateUserDto.birthdate ? parsedDate : undefined
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException("Error updating user information");
    }
  }

  async softDeleteUser(id: string) {
    try {
      const deleteUser = await this.userRepository.softDelete(id);

      if (deleteUser.affected === 0) {
        throw new NotFoundException('User not found')
      }

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException("Error soft deleting user")
    }
  }

  async restoreDeletedUser(id: string) {
    try {
      const restoreUser = await this.userRepository.restore(id);
    } catch (error) {
      throw new InternalServerErrorException("Error restoring deleted user")
    }
  }

  async getUserByProfileName(profileName: string) {
    const user = await this.userRepository.createQueryBuilder('user')
      .innerJoin('user.profile', 'profile')
      .where('profile.profileName = :profileName', { profileName })
      .select(['user.id', 'user.name', 'user.lastname', 'user.birthdate', 'user.createdAt'])
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, user: User) {
    const userToBeUpdated = await this.userRepository.preload({
      id,
      ...user,
    });

    if (!userToBeUpdated) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.save(userToBeUpdated);

  }

  async markUserAsConfirmed(user: User) {
    if (user.isEmailConfirmed) {
      throw new BadRequestException('User already confirmed');
    }

    user.isEmailConfirmed = true;

    return this.userRepository.save(user);
  }
}
