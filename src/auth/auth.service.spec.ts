import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { ConflictException } from '@nestjs/common';

jest.mock('bcrypt');

const bcryptMocked = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {

  const id = 1;
  const email = 'example@email.com';
  const password = 'holamundo';
  
  let authService: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;
  
  beforeEach(async () => {

    bcryptMocked.hash.mockReset();
    bcryptMocked.compare.mockReset();
    
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn()
          }
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn()
          }
        }
      ],
    }).compile();

    authService = app.get<AuthService>(AuthService);
    usersService = app.get<jest.Mocked<UsersService>>(UsersService);
    jwtService = app.get<jest.Mocked<JwtService>>(JwtService);
  });

  it('service should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('login', async () => {
    jwtService.sign.mockReturnValue('TOKEN');
    await expect(authService.login({ id, email })).resolves.toEqual({ access_token: 'TOKEN' });
    expect(jwtService.sign).toHaveBeenCalledWith({ id, email });
  });

  
  describe('signup', () => {
    
    it('throw an exception if already exists an user with the same email', async () => {
      usersService.findByEmail.mockResolvedValue({} as User);
      await expect(authService.signUp('example@email.com', 'holamundo')).rejects.toThrow(ConflictException);
    });

    it('create the user account', async () => {
      jwtService.sign.mockReturnValue('TOKEN');
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id, email, password } as User);
      bcryptMocked.hash.mockImplementation(() => Promise.resolve('hash'));
      await expect(authService.signUp(email, password)).resolves.toEqual({ access_token: 'TOKEN' });
      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(usersService.create).toHaveBeenCalledWith(email, 'hash');
    });
  });

  describe('validateUser', () => {

    it('return null if the user doesn\'t exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      bcryptMocked.compare.mockImplementation(() => Promise.resolve(false));
      await expect(authService.validateUser(email, password)).resolves.toBe(null);
    });
    
    it('return null if the password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue({} as User);
      bcryptMocked.compare.mockImplementation(() => Promise.resolve(false));
      await expect(authService.validateUser(email, password)).resolves.toBe(null);
    });

    it('return the user if the user exists and the password is correct', async () => {
      usersService.findByEmail.mockResolvedValue({ id, email } as User);
      bcryptMocked.compare.mockImplementation(() => Promise.resolve(true));
      await expect(authService.validateUser(email, password)).resolves.toEqual({ id, email });
    });
  });
});
