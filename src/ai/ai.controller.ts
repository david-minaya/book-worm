import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { AIService } from './ai.service';
import { MessageDto } from './dtos/message.dto';
import { User } from '../decorators/user.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse } from '@nestjs/swagger';
import { SummarizeFileDto } from './dtos/summarizeFile.dto';
import { ChatDto } from './dtos/chat.dto';
import { ChatMessageDto } from './dtos/chatMessage.dto';

import { 
  Body, 
  Controller, 
  Get, 
  HttpCode, 
  Param, 
  ParseFilePipeBuilder, 
  ParseIntPipe, 
  Post,
  UploadedFile, 
  UseInterceptors 
} from '@nestjs/common';

const fileValidator = new ParseFilePipeBuilder()
  .addFileTypeValidator({ fileType: 'pdf' })
  .build();

@ApiBearerAuth()
@Controller('ai')
export class AIController {
  
  constructor(private service: AIService) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'PDF file', type: SummarizeFileDto })
  @ApiOkResponse({ description: 'New chat', type: ChatDto })
  @Post('/summarize-file')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { dest: path.join(__dirname, '..', 'uploads') }))
  async summarizeFile(@User('id') userId: number, @UploadedFile(fileValidator) file: Express.Multer.File) {
    return this.service.summarizeFile(userId, file);
  }

  @ApiOkResponse({ description: 'List of chats', type: [ChatDto] })
  @Get('/chats')
  async getChats(@User('id') userId: number) {
    return this.service.getChats(userId);
  }

  @ApiOkResponse({ description: 'Chat', type: ChatDto })
  @Get('/chats/:id')
  async getChat(@User('id') userid: number, @Param('id', ParseIntPipe) chatId: number) {
    return this.service.getChat(userid, chatId);
  }

  @ApiOkResponse({ description: 'Message', type: ChatMessageDto })
  @Post('/chats/:id/send-message')
  @HttpCode(200)
  async sendMessage(@User('id') userId: number, @Param('id', ParseIntPipe) chatId: number, @Body() message: MessageDto) {
    return this.service.sendMessage(userId, chatId, message);
  }
}
