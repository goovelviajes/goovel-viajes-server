import { BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from "bcryptjs";
import { User } from 'src/user/entities/user.entity';
import { ProfileService } from '../profile/profile.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let profileService: jest.Mocked<ProfileService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            getUserByEmail: jest.fn()
          }
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn()
          }
        },
        {
          provide: ProfileService,
          useValue: {
            getUniqueProfileName: jest.fn()
          }
        }
      ]
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    profileService = module.get(ProfileService)

    jest.spyOn(bcrypt as any, 'genSalt').mockResolvedValue('salt');
    jest.spyOn(bcrypt as any, 'hash').mockResolvedValue('hashedPassword');
    jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Register', () => {
    it('Should register a new user succesfully', async () => {
      const registerDto: RegisterDto = {
        name: 'test',
        lastname: 'test',
        email: 'test@gmail.com',
        password: 'pass1234',
        birthdate: '2000-01-01'
      } as RegisterDto;

      profileService.getUniqueProfileName.mockResolvedValue('juan123');
      userService.create.mockResolvedValue({} as any);

      const result = await authService.register(registerDto);

      expect(profileService.getUniqueProfileName).toHaveBeenCalledWith('test');
      expect(userService.create).toHaveBeenCalledWith(expect.objectContaining({
        password: 'hashedPassword',
        birthdate: new Date("2000-01-01T00:00:00")
      }))
      expect(result).toEqual({ message: 'Registration Successful' })
    })

    it('Should return BadRequest if password is missing', async () => {
      const dto = {
        name: 'test',
        lastname: 'test',
        email: 'test@gmail.com',
        birthdate: '2000-01-01'
      } as any;

      await expect(authService.register(dto)).rejects.toThrow(BadRequestException);
    })

    it('Should return BadRequest if date is invalid', async () => {
      const registerDto: RegisterDto = {
        name: 'test',
        lastname: 'test',
        email: 'test@gmail.com',
        password: 'pass1234',
        birthdate: 'invalid-date'
      } as RegisterDto;

      await expect(authService.register(registerDto)).rejects.toThrow(BadRequestException)
    })

    it('Should return InternalServerError if an unexpected error occurs', async () => {
      (bcrypt.genSalt as jest.Mock).mockRejectedValue(new Error('bcrypt failed'));

      const dto = {
        name: 'Tomas',
        email: 'test@test.com',
        password: '1234',
        birthdate: '1990-01-01',
      } as any;

      await expect(authService.register(dto)).rejects.toThrow(InternalServerErrorException);
    })
  });

  describe('Login', () => {
    beforeEach(() => {
      process.env.SECRET_KEY = 'test-secret'
    });

    it('Should login a user successfully', async () => {
      userService.getUserByEmail.mockResolvedValue({
        id: 'user123',
        email: 'test@test.com',
        password: 'hashed',
      } as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const dto = { email: 'test@gmail.com', password: 'pass1234' };

      const result = await authService.login(dto);

      expect(result).toEqual({ access_token: 'jwt-token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user123', email: 'test@test.com' },
        { secret: 'test-secret' }
      )
    })

    it('Should return UnauthorizedError if the user does not exist', async () => {
      userService.getUserByEmail.mockResolvedValue(null);

      const dto = {
        email: 'test@gmail.com',
        password: 'pass1234'
      } as LoginDto;

      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException);
    })

    it('Should return UnauthorizedError if the credentials are invalid', async () => {
      userService.getUserByEmail.mockResolvedValue({ id: 'user01', name: 'test', lastname: 'test', email: 'test@gmail.com', password: 'pass1234' } as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const dto = { email: 'test@test.com', password: '1234' } as any;

      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException)
    })

    it('Should return UnauthorizedError if secret key is missing', async () => {
      delete process.env.SECRET_KEY;

      userService.getUserByEmail.mockResolvedValue({ id: 'user01', name: 'test', lastname: 'test', email: 'test@gmail.com', password: 'pass1234' } as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const dto = { email: 'test@gmail.com', password: 'pass1234' } as any;

      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException)
    })

    it('Should return InternalServerError if an unexpected error occurs', async () => {
      userService.getUserByEmail.mockRejectedValue(new Error('DB fail'));

      const dto = { email: 'test@test.com', password: 'pass1234' } as any;

      await expect(authService.login(dto)).rejects.toThrow(InternalServerErrorException)
    })
  })
});
