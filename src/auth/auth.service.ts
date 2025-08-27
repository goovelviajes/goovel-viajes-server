import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { AuthProvider } from './enums/auth-provider.enum';

@Injectable()
export class AuthService {
  private client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto) {
    try {
      if (registerDto.provider === 'local' && !registerDto.password) {
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

      //preparacion de un objeto usuario
      const userToCreate = {
        ...registerDto,
        birthdate,
        password: hashedPassword,
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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error user login');
    }
  }

  async loginWithGoogle(idToken: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      })

      const payload = ticket.getPayload();

      const email = payload?.email;
      const name = payload?.name;
      const picture = payload?.picture;
      const googleId = payload?.sub;


      if (!email) throw new UnauthorizedException('Invalid Google token');

      let user = await this.userService.getUserByEmail(email)

      if (!user) {
        user = await this.userService.create({
          email,
          name,
          picture,
          googleId,
          provider: AuthProvider.GOOGLE,
        });
      }

      const SECRET_KEY = process.env.SECRET_KEY;

      const token = this.jwtService.sign({ sub: user.id, email: user.email }, { secret: SECRET_KEY });

      return {
        token,
        user,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException("Error login with Google")
    }
  }
}
