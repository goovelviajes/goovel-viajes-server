import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(registerDto.password, salt);

      const birthdate = new Date(registerDto.birthdate + 'T00:00:00');

      if (isNaN(birthdate.getTime())) {
        throw new BadRequestException('Invalid birthdate format');
      }

      const userToCreate = {
        ...registerDto,
        birthdate,
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

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;
      const user = await this.userService.getUserByEmail(email);

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword)
        throw new UnauthorizedException('Invalid credentials');

      const secretKey = process.env.SECRET_KEY;
      if (!secretKey) throw new UnauthorizedException('Secret key not found');

      const payload = { sub: user.id, email: user.email };

      const token = await this.jwtService.signAsync(payload, {
        secret: secretKey,
      });

      return { access_token: token };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error user login');
    }
  }
}
