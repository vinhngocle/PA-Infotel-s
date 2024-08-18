import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { BookingService } from './booking.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @UseGuards(AccessTokenGuard)
  @Get(':confirmation_no')
  @ApiOperation({ summary: 'Convert booking xml to json use third-party' })
  async xmlToJson(@Param('confirmation_no') confirmationNo: string) {
    return await this.bookingService.convertXmlToJson(confirmationNo);
  }
}
