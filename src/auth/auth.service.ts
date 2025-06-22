import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import InjectRepository from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import bcryptjs from 'bcryptjs';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async register(registerDto: RegisterDto) {
    try {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(registerDto.password, salt);

      const userToCreate = {
        ...registerDto,
        password: hashedPassword,
      };

      await this.userService.create(userToCreate);

      return {
        message: 'Registration Successful',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error user register');
    }
  }
}
