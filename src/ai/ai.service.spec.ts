import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AIService } from './ai.service';
import { ConfigService } from '@nestjs/config';
import { PDFExtract } from 'pdf.js-extract';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageDto } from './dtos/message.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';

// @ts-expect-error ignore
import { GoogleAIFileManager } from '@google/generative-ai/files';

jest.mock('@google/generative-ai');
jest.mock('@google/generative-ai/files');
jest.mock('pdf.js-extract');

const GoogleAIFileManagerMocked = jest.mocked(GoogleAIFileManager);
const GoogleGenerativeAIMocked = jest.mocked(GoogleGenerativeAI);
const PDFExtractMocked = jest.mocked(PDFExtract);

describe('AIService', () => {
  
  let aiService: AIService;
  let chatRepo: jest.Mocked<Repository<Chat>>;
  let messageRepo: jest.Mocked<Repository<Message>>;

  const startChatMock = jest.fn();
  const sendMessageMock = jest.fn();
  
  beforeEach(async () => {

    GoogleAIFileManagerMocked.mockReset();
    GoogleGenerativeAIMocked.mockReset();
    PDFExtractMocked.mockReset();

    startChatMock.mockReset();
    sendMessageMock.mockReset();

    GoogleGenerativeAIMocked.mockImplementation(() => ({
      getGenerativeModel: () => ({
        startChat: startChatMock.mockReturnValue({
          sendMessage: sendMessageMock
        })
      })
    } as any));

    PDFExtractMocked.mockImplementation(() => ({
      extract: () => ({
        pages: []
      })
    }) as any);
    
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('JWT')
          }
        },
        {
          provide: getRepositoryToken(Chat),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            findBy: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(Message),
          useValue: {
            find: jest.fn(),
            save: jest.fn()
          }
        },
      ],
    }).compile();

    aiService = app.get<AIService>(AIService);
    chatRepo = app.get<jest.Mocked<Repository<Chat>>>(getRepositoryToken(Chat));
    messageRepo = app.get<jest.Mocked<Repository<Message>>>(getRepositoryToken(Message));
  });

  it('service should be defined', () => {
    expect(aiService).toBeDefined();
  });

  it('summarizeFile', async () => {

    sendMessageMock.mockResolvedValue({ response: { text: () => 'ai:message' } });
    chatRepo.save.mockResolvedValue({ id: 1 } as Chat);
    chatRepo.findOne.mockResolvedValue({ id: 1 } as Chat);

    const result = await aiService.summarizeFile(1, { path: '/2', mimetype: 'txt', originalname: 'filename' } as any);

    expect(result).toEqual({ id: 1 });
    
    expect(sendMessageMock).toHaveBeenCalledWith(expect.anything());

    expect(startChatMock).toHaveBeenCalledWith({
      generationConfig: { maxOutputTokens: 1000 }
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      user: { id: 1 },
      messages: [
        { role: 'user', prompt: { text: expect.any(String) }, file: { name: 'filename', mimeType: 'txt', uri: '/2', content: '' } },
        { role: 'model', text: 'ai:message' }
      ]
    }));

    expect(chatRepo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: { messages: true }
    });
  });

  it('getChats', async () => {
    chatRepo.findBy.mockResolvedValue([{ id: 1 }] as Chat[]);
    const result = await aiService.getChats(1);
    expect(chatRepo.findBy).toHaveBeenCalledWith({ user: { id: 1 } });
    expect(result).toEqual([{ id: 1}]);
  });

  describe('getChat', () => {

    it('throw an exeception if the chat doesn\'t exist', async () => {
      chatRepo.findOne.mockResolvedValue(null);
      await expect(aiService.getChat(1, 2)).rejects.toThrow(NotFoundException);
    });

    it('get the chat', async () => {

      chatRepo.findOne.mockResolvedValue({ id: 1 } as Chat);
      
      await expect(aiService.getChat(1, 2)).resolves.toEqual({ id: 1 });

      expect(chatRepo.findOne).toHaveBeenCalledWith({ 
        where: { id: 2, user: { id: 1 } },
        relations: { messages: true }
      });
    });
  });

  describe('sendMessage', () => {

    it('throw an exception if the user or the chat don\'t exist', async () => {
      messageRepo.find.mockResolvedValue([]);
      await expect(aiService.sendMessage(1, 2, {} as MessageDto)).rejects.toThrow(NotFoundException);
    });

    it('send the message', async () => {
      
      messageRepo.find.mockResolvedValue([{ role: 'model', text: 'a' }] as Message[]);
      messageRepo.save.mockResolvedValue({ id: 10 } as Message);
      sendMessageMock.mockResolvedValue({ response: { text: () => 'ai:message' }});
      
      const result = await aiService.sendMessage(1, 2, { text: 'user:message' } as MessageDto);
      
      expect(messageRepo.find).toHaveBeenCalledWith({
        where: { chat: { id: 2, user: { id: 1 } } },
        relations: { prompt: true }
      });

      expect(startChatMock).toHaveBeenCalledWith(expect.objectContaining({
        history: [{ role: 'model', parts: [{ text: 'a' }]}],
        generationConfig: { maxOutputTokens: 1000 }
      }));

      expect(sendMessageMock).toHaveBeenCalledWith('user:message');

      expect(messageRepo.save).toHaveBeenNthCalledWith(1, {
        role: 'user',
        text: 'user:message',
        chat: { id: 2 }
      });

      expect(messageRepo.save).toHaveBeenNthCalledWith(2, {
        role: 'model',
        text: 'ai:message',
        chat: { id: 2 }
      });

      expect(result).toEqual({ id: 10 });
    });
  });
});
