import { Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Response } from 'express';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UseGuards(AccessTokenGuard)
  @Post(':confirmation_no')
  getPayment(@Param('confirmation_no') confirmationNo: string) {
    return 'post payment';
  }
}
