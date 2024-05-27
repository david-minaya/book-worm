import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileDto } from './file.dto';

enum Role {
  model = 'model',
  user = 'user'
}

export class ChatMessageDto {

  @ApiProperty()
  id: number;
  
  @ApiProperty({ enum: ['model', 'user']})
  role: Role;

  @ApiProperty()
  date: string;

  @ApiPropertyOptional()
  text?: string;

  @ApiPropertyOptional()
  file?: FileDto;
}
