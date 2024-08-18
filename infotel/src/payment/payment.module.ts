import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { BookingService } from 'src/booking/booking.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, BookingService],
})
export class PaymentModule {}
