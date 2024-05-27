import { Injectable, NotFoundException } from '@nestjs/common';
import { PDFExtract } from 'pdf.js-extract';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Repository } from 'typeorm';
import { MessageDto } from './dtos/message.dto';
import { Message } from './entities/message.entity';
import { Content, GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

// @ts-expect-error ignore
import { GoogleAIFileManager } from '@google/generative-ai/files';

@Injectable()
export class AIService {

  private model: GenerativeModel;
  private fileManager: GoogleAIFileManager;
  
  constructor(
    config: ConfigService,
    @InjectRepository(Chat)
    private chatRepo: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>
  ) {
    const apiKey = config.get<string>('GEMINI_API_KEY')!;
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    this.fileManager = new GoogleAIFileManager(apiKey);
  }

  async summarizeFile(userId: number, file: Express.Multer.File) {
      
    const pdfContent = await this.pdfToText(file);
      
    const prompt = `I will send you the text content of a pdf file, I want that you generate a summary of it. The summary must have a max of 2000 characteres:\n\nThe pdf text content is the following:\n\n${pdfContent}`;

    const chat = this.model.startChat({
      generationConfig: {
        maxOutputTokens: 1000
      }
    });

    const result = await chat.sendMessage(prompt);

    const savedChat = await this.chatRepo.save({
      user: { id: userId },
      messages: [
        { 
          role: 'user', 
          prompt: { text: prompt },
          file: {
            name: file.originalname,
            mimeType: file.mimetype,
            uri: file.path,
            content: pdfContent
          } 
        },
        { 
          role: 'model', 
          text: result.response.text() 
        }
      ]
    });

    return this.chatRepo.findOne({ 
      where: { id: savedChat.id },
      relations: { messages: true }
    });
  }

  private async pdfToText(file: Express.Multer.File) {
    
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extract(file.path);

    let text = '';

    for (const page of data.pages) {
      // @ts-expect-error ignore
      const lines = PDFExtract.utils.pageToLines(page, 2);
      // @ts-expect-error ignore
      const rows = PDFExtract.utils.extractTextRows(lines);
      text += rows.map((row: string[]) => row.join('')).join('') + '\n\n';
    }

    return text;
  }

  async getChats(userId: number) {
    return this.chatRepo.findBy({ user: { id: userId } });
  }

  async getChat(userId: number, id: number) {

    const chat = await this.chatRepo.findOne({ 
      where: { id, user: { id: userId } },
      relations: { messages: true }
    });

    if (!chat) {
      throw new NotFoundException();
    }

    return chat;
  }

  async sendMessage(userId: number, chatId: number, message: MessageDto) {

    const messages = await this.messageRepo.find({
      where: { 
        chat: { 
          id: chatId, 
          user: { id: userId } 
        } 
      },
      relations: { prompt: true }
    });

    if (messages.length === 0) {
      throw new NotFoundException();
    }

    const history: Content[] = messages.map(message => {

      const parts = [];

      if (message.text) {
        parts.push({ text: message.text });
      }

      if (message.prompt) {
        parts.push({ text: message.prompt.text });
      }

      return {
        role: message.role,
        parts
      };
    });

    const chat = this.model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 1000
      }
    });

    const chatResponse = await chat.sendMessage(message.text);
    
    await this.messageRepo.save({
      role: 'user',
      text: message.text,
      chat: { id: chatId }
    });

    const res = await this.messageRepo.save({
      role: 'model',
      text: chatResponse.response.text(),
      chat: { id: chatId }
    });

    return res;
  }
}
