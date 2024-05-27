import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule, TypeOrmModuleConfig, entities } from '../src/app.module';
import { User } from '../src/users/user.entity';

describe('AuthController (e2e)', () => {
  
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    
    const moduleFixture: TestingModule = await Test
      .createTestingModule({ imports: [AppModule] })
      .overrideModule(TypeOrmModuleConfig)
      .useModule(TypeOrmModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          type: 'postgres',
          host: config.get<string>('TEST_DB_HOST'),
          port: parseInt(config.get<string>('TEST_DB_PORT')!),
          username: config.get<string>('TEST_DB_USER'),
          password: config.get<string>('TEST_DB_PASS'),
          database: config.get<string>('TEST_DB_NAME'),
          synchronize: config.get<string>('TEST_DB_SYNCHRONIZE') === 'true',
          entities
        })
      }))
      .compile();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    userRepo = dataSource.getRepository(User);
    app = moduleFixture.createNestApplication();

    await app.init();
  });

  describe('/auth/signup (POST)', () => {

    it('invalid body', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email2: 'davidminaya3@gmail.com' })
        .expect(400);
    });

    describe('create user account', () => {

      it('test', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({ email: 'example@email.com', password: 'holamundo' })
          .expect(201)
          .expect(res => {
            expect(res.body).toEqual(expect.objectContaining({ 
              access_token: expect.stringMatching(/.+/) 
            }));
          });
      });

      afterAll(async () => {
        await userRepo.delete({});
      });
    });

    describe('fail if already exists a user with the same email', () => {

      beforeAll(async () => {
        await userRepo.save({ 
          email: 'example@email.com', 
          password: 'holamundo' 
        });
      });

      it('test', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({ email: 'example@email.com', password: 'holamundo2' })
          .expect(409);
      });

      afterAll(async () => {
        await  userRepo.delete({});
      });
    });
  });

  describe('/auth/login (POST)', () => {

    it('invalid body', () => {
      return request(app.getHttpServer())
        .post('/auth/loging')
        .send({ email2: 'davidminaya3@gmail.com' })
        .expect(404);
    });

    it('wrong user or password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'example2@email.com', password: 'holamundo' })
        .expect(401);
    });

    describe('login successful', () => {

      beforeAll(async () => {
        await userRepo.save({ 
          email: 'example@email.com', 
          password: await bcrypt.hash('holamundo', 10) 
        });
      });

      it('test', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'example@email.com', password: 'holamundo' })
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual(expect.objectContaining({ 
              access_token: expect.stringMatching(/.+/) 
            }));
          });
      });

      afterAll(async () => {
        await userRepo.delete({});
      });
    });
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await app.close();
  });
});
