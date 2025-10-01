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
    try {
      const exists = await this.isUserAlreadyExists(createUserDto.email);

      if (exists) {
        throw new BadRequestException('Email is already existent');
      }

      const newUser = this.userRepository.create(createUserDto);

      return await this.userRepository.save(newUser);
    } catch (error) {
      console.log(error)
      if (error instanceof HttpException) {
        throw error;
      }
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
        select: ['id', 'name', 'email', 'password'],
        withDeleted: true
      });

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error getting user by email');
    }
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
    try {
      const user = await this.userRepository.findOne({ where: { id }, withDeleted: true, select: ['id', 'name', 'lastname', 'email', 'birthdate', 'createdAt', 'updatedAt', 'deletedAt', 'role'] });


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

  /**
   * Actualiza la información adicional del usuario, con datos específicos
   * que no se establecieron en el registro inicial (por ejemplo, datos de facturación).
   */
  async updateUserInformation(id: string, updateUserDto: UpdateUserDto): Promise<User> {
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

      return await this.userRepository.save(user);
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

      console.log(restoreUser)
    } catch (error) {
      throw new InternalServerErrorException("Error restoring deleted user")
    }
  }
}
