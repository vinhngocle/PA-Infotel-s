import { Injectable } from '@nestjs/common';
import { BookingService } from 'src/booking/booking.service';
import { BookingDto } from 'src/dtos/booking/BookingDto';
import axios from 'axios';

@Injectable()
export class PaymentService {
  constructor(private bookingService: BookingService) {}

  async paymentIntegration(bookingDto: BookingDto) {
    const booking = await this.bookingService.convertXmlToJson(bookingDto);
    const amount = booking?.rateamount.amount || 0;
    const sanboxUrl = `https://sandbox2.nganluong.vn/vietcombank-checkout/vcb/api/web/checkout/version_1_0/`;
    const response = await axios.post(
      sanboxUrl,
      {
        amount,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data;
  }
}
