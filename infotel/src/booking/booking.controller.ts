import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { BookingService } from './booking.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @UseGuards(AccessTokenGuard)
  @Get(':confirmation_no_1')
  @ApiOperation({ summary: 'Convert booking xml to json use third-party' })
  async xmlToJson(@Param('confirmation_no_1') confirmationNo: string) {
    return await this.bookingService.convertXmlToJson(confirmationNo);
  }

  @UseGuards(AccessTokenGuard)
  @Get(':confirmation_no_2')
  @ApiOperation({
    summary: 'Convert booking xml to json not use third-party',
  })
  async xmlToJsonNotUseThirdParty(
    @Param('confirmation_no_2') confirmationNo: string,
  ) {
    return await this.bookingService.convertXmlToJsonNotUseThirdParty(
      confirmationNo,
    );
  }
}
