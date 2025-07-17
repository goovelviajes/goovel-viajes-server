import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
//importaciones necesarias para cofiguracion de prueba 
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

describe('AuthService', () => {
  let service: AuthService;
  let UserServiceMock: jest.Mocked<UserService>;

  beforeEach(async () => {
    //creamos una instancia MOCK de UserService
    UserServiceMock = {
      create: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserById: jest.fn(), 
      updateUserInformation: jest.fn(),
      softDeleteUser: jest.fn(),
      restoreDeletedUser: jest.fn(),  
      filterUsersByDniCuitOrCbu: jest.fn(),
    } as unknown as jest.Mocked<UserService>

    const jwtServiceMock={
      //definir metodos que necesitas en el mock jwtService
    }

    //iniciamos el modulo de prueba
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService,
        {
          provide: UserService,
          useValue: UserServiceMock
        },{
          provide:JwtService,
          useValue:jwtServiceMock 
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => { 
    expect(service).toBeDefined(); 
  });
});
