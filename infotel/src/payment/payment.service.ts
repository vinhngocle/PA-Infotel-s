import { Injectable } from '@nestjs/common';
import { BookingService } from 'src/booking/booking.service';

@Injectable()
export class PaymentService {
  constructor(private bookingService: BookingService) {}
}
