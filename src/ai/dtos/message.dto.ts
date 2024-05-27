import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class MessageDto {
  @ApiProperty()
  @IsNotEmpty()
  text: string;
}
