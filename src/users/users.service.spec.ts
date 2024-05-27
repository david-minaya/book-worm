import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  
  let service: UsersService;
  let repo: Repository<User>;

  beforeEach(async () => {
    
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
            findOneBy: jest.fn()
          }
        }
      ],
    }).compile();

    service = app.get<UsersService>(UsersService);
    repo = app.get<Repository<User>>(getRepositoryToken(User));
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create user', async () => {
    await service.create('example@email.com', 'holamundo');
    expect(repo.save).toHaveBeenCalledWith({ email: 'example@email.com', password: 'holamundo' });
  });

  it('find user by email', async () => {
    await service.findByEmail('example@email.com');
    expect(repo.findOneBy).toHaveBeenCalledWith({ email: 'example@email.com' });
  });
});
