import { ApiProperty } from '@nestjs/swagger';

export class FileDto {

  @ApiProperty()
  id: number;

  @ApiProperty()
  date: string;

  @ApiProperty()
  name: string;
  
  @ApiProperty()
  mimeType: string;
  
  @ApiProperty()
  uri: string;
  
  @ApiProperty()
  content: string;
}
