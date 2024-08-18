import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class BookingDto {
  @ApiProperty({
    example: '173903',
  })
  @IsNotEmpty()
  confirmation_no: string;
}
