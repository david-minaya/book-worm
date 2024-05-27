import * as path from 'path';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule, TypeOrmModuleConfig, entities } from '../src/app.module';
import { Chat } from '../src/ai/entities/chat.entity';
import { Message } from '../src/ai/entities/message.entity';
import { File } from '../src/ai/entities/file.entity';
import { Prompt } from '../src/ai/entities/prompt.entity';

describe('AIController (e2e)', () => {
  
  let app: INestApplication;
  let dataSource: DataSource;
  let chatRepo: Repository<Chat>;
  let messageRepo: Repository<Message>;
  let fileRepo: Repository<File>;
  let promptRepo: Repository<Prompt>;
  let token: string;

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

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    chatRepo = dataSource.getRepository(Chat);
    messageRepo = dataSource.getRepository(Message);
    fileRepo = dataSource.getRepository(File);
    promptRepo = dataSource.getRepository(Prompt);

    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'example@email.com', password: 'holamundo' });

    token = res.body.access_token;
  });
  
  describe('/ai/summarize-file (POST)', () => {

    it('without authorization', () => {
      return request(app.getHttpServer())
        .post('/ai/summarize-file')
        .expect(401);
    });

    it('invalid request', () => {
      return request(app.getHttpServer())
        .post('/ai/summarize-file')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('summarize file', () => {
      return request(app.getHttpServer())
        .post('/ai/summarize-file')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', path.join(__dirname, './test-pdf.pdf'))
        .expect(200)
        .expect(res => {
          expect(res.body).toMatchObject({
            id: 1,
            date: expect.any(String),
            messages: [
              {
                id: 1,
                role: 'user',
                date: expect.any(String),
                text: null,
                file: {
                  name: 'test-pdf.pdf',
                  mimeType: 'application/pdf',
                  uri: expect.any(String)
                } 
              },
              {
                id: 2,
                role: 'model',
                date: expect.any(String),
                text: expect.any(String),
                file: null
              }
            ]
          });
        });
    }, 60000);

    afterAll(async () => {
      await promptRepo.delete({});
      await fileRepo.delete({});
      await messageRepo.delete({});
      await chatRepo.delete({});
    });
  });

  describe('/ai/chats (GET)', () => {

    it('without authorization', () => {
      return request(app.getHttpServer())
        .get('/ai/chats')
        .expect(401);
    });

    it('get empty chats', () => {
      return request(app.getHttpServer())
        .get('/ai/chats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect([]);
    });

    describe('get chats', () => {

      let chat: Chat;

      beforeAll(async () => {
        chat = await chatRepo.save({ user: { id: 1 } });
      });

      it('test', () => {
        return request(app.getHttpServer())
          .get('/ai/chats')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect([{ id: chat.id, date: chat.date.toISOString() }]);
      });

      afterAll(async () => {
        await chatRepo.delete({});
      });
    });
  });

  describe('/ai/chat/:id (GET)', () => {

    it('without authorization', () => {
      return request(app.getHttpServer())
        .get('/ai/chats/1')
        .expect(401);
    });

    it('Invalid request', () => {
      return request(app.getHttpServer())
        .get('/ai/chats/1ds')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('chat doesn\'t exists', () => {
      return request(app.getHttpServer())
        .get('/ai/chats/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    describe('get chat', () => {

      let chat: Chat;

      beforeAll(async () => {
        chat = await chatRepo.save({ 
          user: { id: 1 },
          messages: [
            { role: 'user', text: 'user:message' },
            { role: 'model', text: 'model:message' }
          ]
        });
      });

      it('test', () => {
        return request(app.getHttpServer())
          .get(`/ai/chats/${chat.id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect(res => {

            expect(res.body).toMatchObject({ id: chat.id, date: chat.date.toISOString() });
            
            const messages = chat.messages.map(message => ({ 
              id: message.id, 
              role: message.role, 
              date: message.date.toISOString(), 
              text: message.text,
              file: null
            }));
            
            expect(res.body.messages).toContainEqual(messages[0]);
            expect(res.body.messages).toContainEqual(messages[1]);
          });
      });

      afterAll(async () => {
        await messageRepo.delete({});
        await chatRepo.delete({});
      });
    });
  });

  describe('/ai/chats/:id/send-message (POST)', () => {

    it('without authorization', () => {
      return request(app.getHttpServer())
        .post('/ai/chats/1/send-message')
        .expect(401);
    });

    it('Invalid request', () => {
      return request(app.getHttpServer())
        .post('/ai/chats/1ds/send-message')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('Invalid request body', () => {
      return request(app.getHttpServer())
        .post('/ai/chats/1ds/send-message')
        .set('Authorization', `Bearer ${token}`)
        .send({ tex: 'message' })
        .expect(400);
    });

    it('chat doesn\'t exists', () => {
      return request(app.getHttpServer())
        .post('/ai/chats/1/send-message')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'user:message' })
        .expect(404);
    });

    describe('send message', () => {

      let chat: Chat;

      beforeAll(async () => {
        const response = await request(app.getHttpServer())
          .post('/ai/summarize-file')
          .set('Authorization', `Bearer ${token}`)
          .attach('file', path.join(__dirname, './test-pdf.pdf'));
        chat = response.body;
      });

      it('test', () => {
        return request(app.getHttpServer())
          .post(`/ai/chats/${chat.id}/send-message`)
          .set('Authorization', `Bearer ${token}`)
          .send({ text: 'user:message' })
          .expect(200)
          .expect(res => {
            expect(res.body).toMatchObject({
              id: expect.any(Number),
              role: 'model',
              text: expect.any(String),
              date: expect.any(String),
              chat: { id: chat.id }
            });
          });
      });

      afterAll(async () => {
        await promptRepo.delete({});
        await fileRepo.delete({});
        await messageRepo.delete({});
        await chatRepo.delete({});
      });
    });
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await app.close();
  });
});
