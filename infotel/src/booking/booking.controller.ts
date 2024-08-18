import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { BookingService } from './booking.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingDto } from 'src/dtos/booking/BookingDto';

@ApiBearerAuth()
@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @UseGuards(AccessTokenGuard)
  @Get(':confirmation_no')
  @ApiOperation({ summary: 'Convert booking xml to json use third-party' })
  async xmlToJson(@Param() bookingDto: BookingDto) {
    return await this.bookingService.convertXmlToJson(bookingDto);
  }
}
