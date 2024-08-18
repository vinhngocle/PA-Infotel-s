import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class BookingDto {
  @ApiProperty({
    example: 'booking_173903',
  })
  @IsNotEmpty()
  confirmation_no: string;
}
