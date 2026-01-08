import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendConfirmationMailDto } from './dto/send-confirmation-mail';
import { Logger } from '@nestjs/common';
import { TooManyRequestsException } from 'src/common/exceptions/too-many-request.exception';

@Injectable()
export class AuthService {
  private readonly logger: Logger;
  private MAX_FAILED_ATTEMPTS = 4;
  private LOCK_TIME_MINUTES = 5;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly profileService: ProfileService,
    private readonly mailService: MailService
  ) {
    this.logger = new Logger(AuthService.name);
  }

  async register(registerDto: RegisterDto) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(registerDto.password, salt);

      const birthdate = new Date(registerDto.birthdate + 'T00:00:00');

      if (isNaN(birthdate.getTime())) {
        throw new BadRequestException('Invalid birthdate format');
      }

      const profile = new Profile();

      profile.profileName = await this.profileService.getUniqueProfileName(registerDto.name);

      const userToCreate = {
        ...registerDto,
        birthdate,
        password: hashedPassword,
        profile
      };

      const createdUser = await this.userService.create(userToCreate);

      this.sendConfirmationMail({ email: createdUser.email })
        .catch(err => {
          this.logger.error(`Critical error: Could not send registration email to ${createdUser.email}`);
          this.logger.error(err.stack);
        });


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
    const { email, password } = loginDto;

    // 1. Buscar usuario
    const user = await this.userService.getUserByEmail(email);

    // 2. Si no existe, usamos una respuesta genérica (Seguridad)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Verificar si está bloqueado
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new TooManyRequestsException(`Account blocked. Try again in ${remainingTime} minutes.`);
    }

    // 4. Validar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      user.failedAttempts++;

      if (user.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + this.LOCK_TIME_MINUTES * 60 * 1000);
      }

      await this.userService.update(user.id, user);

      throw new UnauthorizedException('Invalid credentials');
    }

    // 5. Éxito: Resetear contador
    // Solo actualizamos si había intentos fallidos previos para ahorrar una escritura en DB
    if (user.failedAttempts > 0 || user.lockedUntil) {
      user.failedAttempts = 0;
      user.lockedUntil = null;

      await this.userService.update(user.id, user);
    }

    // 6. Generar Token
    const payload = { sub: user.id, role: user.role };

    const SECRET_KEY = process.env.SECRET_KEY;

    if (!SECRET_KEY) throw new InternalServerErrorException('Secret key not found');

    const token = await this.jwtService.signAsync(payload, {
      secret: SECRET_KEY,
      expiresIn: '14d'
    });

    return { access_token: token };
  }

  async getActiveUser(id: string) {
    const user = await this.userService.getUserByIdWithoutPassword(id);

    if (!user) throw new NotFoundException('User not found');

    return user;
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

    if (user) {
      const payload = { sub: user.id, role: user.role };

      const resetToken = await this.jwtService.signAsync(payload, {
        secret: process.env.SECRET_KEY,
        expiresIn: '15m'
      });

      user.resetToken = resetToken;
      await this.userService.update(user.id, user);

      await this.mailService.sendResetPasswordMail(user.email, resetToken);
    }

    return {
      message: 'If the email is registered, you will receive a reset link shortly.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword)
      throw new UnauthorizedException('Passwords do not match');

    const SECRET_KEY = process.env.SECRET_KEY;
    if (!SECRET_KEY) throw new UnauthorizedException('Secret key not found');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: SECRET_KEY,
      });

      const user = await this.userService.getUserById(payload.sub);

      if (!user || user.resetToken !== token) {
        throw new UnauthorizedException('Token already used or invalid');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.resetToken = null;

      await this.userService.update(user.id, user);

      return { message: 'Password reset successfully' };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Token expired or invalid');
    }
  }

  async sendConfirmationMail(dto: SendConfirmationMailDto) {
    const user = await this.userService.getUserByEmail(dto.email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const SECRET_KEY: string = process.env.SECRET_KEY;
    if (!SECRET_KEY) {
      throw new Error('Secret key not found');
    }

    const confirmationToken: string = await this.jwtService.signAsync(
      { sub: user.id, role: user.role },
      { expiresIn: '1h', secret: SECRET_KEY },
    );

    await this.mailService.sendConfirmationMail(
      user.email,
      confirmationToken,
    );

    return {
      message: 'Confirmation mail sent successfully',
    }
  }

  async confirmEmail(token: string) {
    try {
      const SECRET_KEY = process.env.SECRET_KEY;

      if (!SECRET_KEY) {
        throw new Error('Secret key not found');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: SECRET_KEY,
      });
      const user = await this.userService.getUserById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Cambiamos el valor de isEmailConfirmed a true
      await this.userService.markUserAsConfirmed(user);

      return {
        message: 'Email confirmed successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Token expired or invalid');
    }
  }
}
