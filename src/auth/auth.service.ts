import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Profile } from '../profile/entities/profile.entity';
import { ProfileService } from '../profile/profile.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/user/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly profileService: ProfileService,
    private readonly mailService: MailService
  ) { }

  async register(registerDto: RegisterDto) {
    try {
      if (
        // registerDto.provider === 'local' &&
        !registerDto.password) {
        throw new BadRequestException('Password is neccesary for local registration');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(registerDto.password, salt);

      //conversion y validacion de la fecha de nacimiento
      const birthdate = new Date(registerDto.birthdate + 'T00:00:00');
      //se transforma la fecha a un objeto date

      if (isNaN(birthdate.getTime())) {//si el valor es invalido lanza una exception 
        throw new BadRequestException('Invalid birthdate format');
      }

      const profile = new Profile();

      profile.profileName = await this.profileService.getUniqueProfileName(registerDto.name);

      //preparacion de un objeto usuario
      const userToCreate = {
        ...registerDto,
        birthdate,
        password: hashedPassword,
        profile
      };//este objeto se enviara a userService reamplazando la 
      // contraseña por la hasheada y asegurando que la fecha sea tipo Date

      await this.userService.create(userToCreate);//creacion del usuario en la DB llamando al servicio

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

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

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
      console.error(error)
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error user login');
    }
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    try {
      const { oldPassword, newPassword, confirmPassword } = changePasswordDto;

      const user = await this.userService.getUserById(id);

      const isValidPassword = await bcrypt.compare(oldPassword, user.password);

      if (!isValidPassword)
        throw new UnauthorizedException('Invalid credentials');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      if (newPassword !== confirmPassword)
        throw new UnauthorizedException('Passwords do not match');

      user.password = hashedPassword;

      await this.userService.update(user.id, user);

      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error changing password');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user: User = await this.userService.getUserByEmail(dto.email);

    if (!user) throw new UnauthorizedException('User not found');

    const payload = {
      sub: user.id,
      email: user.email
    }

    const resetToken = await this.jwtService.signAsync(payload, {
      secret: process.env.SECRET_KEY, expiresIn: '15m'
    });

    await this.mailService.sendResetPasswordMail(user.email, resetToken);

    return {
      message: 'Reset password email sent successfully',
    };
  }
}
