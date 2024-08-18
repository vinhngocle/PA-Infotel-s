import { Controller, Param, Post, Res, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Response } from 'express';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { BookingDto } from 'src/dtos/booking/BookingDto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UseGuards(AccessTokenGuard)
  @Post(':confirmation_no')
  async getPayment(@Param() bookingDto: BookingDto, @Res() res: Response) {
    const result = await this.paymentService.paymentIntegration(bookingDto);
    if (result.result_code === '0000') {
      await this.paymentSuccess(res);
    } else {
      await this.paymentFail(res);
    }
  }

  @UseGuards(AccessTokenGuard)
  @Post('/callback/success')
  async paymentSuccess(@Res() res: Response) {
    res.redirect('http://localhost:3000/payment-success');
  }

  @UseGuards(AccessTokenGuard)
  @Post('/callback/fail')
  async paymentFail(@Res() res: Response) {
    res.redirect('http://localhost:3000/payment-fail');
  }
}
