import { ApiProperty } from '@nestjs/swagger';
import { ChatMessageDto } from './chatMessage.dto';

export class ChatDto {

  @ApiProperty()
  id: number;

  @ApiProperty()
  date: string;

  @ApiProperty({ type: [ChatMessageDto] })
  messages: ChatMessageDto[];
}
