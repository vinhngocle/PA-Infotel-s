import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { BookingDto } from 'src/dtos/booking/BookingDto';
import * as xml2js from 'xml2js';

@Injectable()
export class BookingService {
  async convertXmlToJson(bookingDto: BookingDto) {
    const fileName = `booking_${bookingDto.confirmation_no}`;
    const filePath = join(`src/XML/${fileName}.xml`);
    if (!existsSync(filePath)) {
      throw new HttpException(
        'Confirmation no not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const xmlData = readFileSync(filePath, 'utf8');
    const parser = new xml2js.Parser();

    const jsonData = await parser.parseStringPromise(xmlData);

    return await this.formatJsonData(jsonData);
  }

  private formatJsonData(jsonData: any): any {
    try {
      const fetchBookingResponse =
        jsonData?.['soap:Envelope']?.['soap:Body']?.[0]
          ?.FetchBookingResponse?.[0];
      if (!fetchBookingResponse)
        throw new Error('FetchBookingResponse not found');

      // Extracting confirmation_no, resv_name_id, computed_resv_status
      const hotelReservation = fetchBookingResponse?.HotelReservation?.[0];
      if (!hotelReservation) throw new Error('HotelReservation not found');

      const uniqueIDList =
        hotelReservation?.['r:UniqueIDList']?.[0]?.['c:UniqueID'] || [];
      const splitUniqueIDList = uniqueIDList
        .map((id: any) => id._)
        .join(', ')
        .split(',');

      const computedReservationStatus =
        hotelReservation['$']?.['computedReservationStatus'] || null;

      // Extracting arrival, departure, lastName, firstName, title, phones, email
      const resGuest =
        hotelReservation?.['r:ResGuests']?.[0]?.['r:ResGuest']?.[0];
      if (!resGuest) throw new Error('ResGuest not found');

      const arrival =
        resGuest?.['r:ArrivalTransport']?.[0]?.['$']?.time || null;
      const departure =
        resGuest?.['r:DepartureTransport']?.[0]?.['$']?.time || null;

      const profile = resGuest?.['r:Profiles']?.[0]?.['Profile']?.[0];

      const customer = profile?.['Customer']?.[0]?.['PersonName'] || [];
      const firstName = customer?.[0]?.['c:firstName']?.[0] || null;
      const lastName = customer?.[0]?.['c:lastName']?.[0] || null;
      const nameTitle = customer?.[0]?.['c:nameTitle']?.[0] || null;

      const phones =
        profile?.['Phones']?.[0]?.['NamePhone']?.[0]?.['c:PhoneNumber']?.[0] ||
        null;
      const email = profile?.['Email']?.[0]?.['c:Email']?.[0] || null;

      // Extracting booking_created_date
      const reservationHistory =
        hotelReservation?.['r:ReservationHistory']?.[0] || {};
      const createtedDate = reservationHistory?.['$']?.['insertDate'] || null;

      // Extracting adults and children count
      const roomStays =
        hotelReservation?.['r:RoomStays']?.[0]?.['hc:RoomStay']?.[0];
      if (!roomStays) throw new Error('RoomStay not found');

      const guestCount =
        roomStays?.['hc:GuestCounts']?.[0]?.['hc:GuestCount'] || [];
      let adults = 0;
      let children = 0;

      guestCount?.forEach((countObj: any) => {
        const ageQualifyingCode = countObj?.['$']?.ageQualifyingCode;
        const count = parseInt(countObj?.['$']?.count, 10);

        if (ageQualifyingCode === 'ADULT') {
          adults += count;
        } else if (ageQualifyingCode === 'CHILD') {
          children += count;
        }
      });

      // Extracting roomtype, ratecode, rateamount
      const roomType = roomStays?.['hc:RoomTypes']?.[0]?.['hc:RoomType']?.[0];
      const typeCode = roomType?.['$']?.roomTypeCode || null;

      const roomRates = roomStays?.['hc:RoomRates']?.[0]?.['hc:RoomRate']?.[0];
      const rateCode = roomRates?.['$']?.ratePlanCode || null;
      const rateBase =
        roomRates?.['hc:Rates']?.[0]?.['hc:Rate']?.[0]?.['hc:Base']?.[0];

      // Extracting guarantee and method_payment
      const guarantee =
        roomStays?.['hc:Guarantee']?.[0]?.['$']?.guaranteeType || null;
      const payment =
        roomStays?.['hc:Payment']?.[0]?.['hc:PaymentsAccepted']?.[0]?.[
          'hc:PaymentType'
        ]?.[0]?.['hc:OtherPayment']?.[0];
      const methodPayment = payment?.['$']?.type || null;

      const currentBalance = roomStays?.['hc:CurrentBalance']?.[0]?.['_'];

      return {
        confirmation_no: splitUniqueIDList?.[0] || null,
        resv_name_id: splitUniqueIDList?.[1] || null,
        arrival: arrival?.split('T')?.[0] || null,
        departure: departure?.split('T')?.[0] || null,
        adults,
        children,
        roomtype: typeCode,
        ratecode: rateCode,
        rateamount: {
          amount: parseInt(rateBase?.['_'], 10) || null,
          currency: rateBase?.['$']?.currencyCode || null,
        },
        guarantee,
        method_payment: methodPayment,
        computed_resv_status: computedReservationStatus,
        last_name: lastName,
        first_name: firstName,
        title: nameTitle,
        phone_number: phones,
        email,
        booking_balance: currentBalance,
        booking_created_date: createtedDate?.split('T')?.[0] || null,
      };
    } catch (error) {
      console.error('Error formatting JSON data:', error.message);
    }
  }
}
