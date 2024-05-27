import { ApiProperty } from '@nestjs/swagger';

export class SummarizeFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
