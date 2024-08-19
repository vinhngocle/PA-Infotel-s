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

  async convertXmlToJsonS2(bookingDto: BookingDto) {
    const fileName = `booking_${bookingDto.confirmation_no}`;
    const filePath = join(`src/XML/${fileName}.xml`);
    if (!existsSync(filePath)) {
      throw new HttpException(
        'Confirmation no not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const xmlData = readFileSync(filePath, 'utf8');
    const jsonData = this.parseXmlToJson(xmlData);
    return this.formatJson(jsonData);
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

  private parseXmlToJson(xmlData: string): any {
    const jsonData: any = {};

    // Extracting confirmation_no and computed_resv_status
    jsonData.confirmation_no = this.extractValue(xmlData, 'UniqueID');
    jsonData.computed_resv_status = this.extractAttributeValue(
      xmlData,
      'HotelReservation',
      'computedReservationStatus',
    );

    // Extracting arrival and departure times
    jsonData.arrival = this.extractAttributeValue(
      xmlData,
      'ArrivalTransport',
      'time',
    );
    jsonData.departure = this.extractAttributeValue(
      xmlData,
      'DepartureTransport',
      'time',
    );

    // Extracting first_name, last_name, title
    jsonData.first_name = this.extractValue(xmlData, 'c:firstName');
    jsonData.last_name = this.extractValue(xmlData, 'c:lastName');
    jsonData.title = this.extractValue(xmlData, 'c:nameTitle');

    // Extracting phone_number and email
    jsonData.phone_number = this.extractValue(xmlData, 'c:PhoneNumber');
    jsonData.email = this.extractValue(xmlData, 'c:Email');

    // Extracting booking_created_date
    jsonData.booking_created_date = this.extractAttributeValue(
      xmlData,
      'ReservationHistory',
      'insertDate',
    );

    // Extracting adults and children count
    const guestCounts = this.extractTagValues(xmlData, 'hc:GuestCount');
    jsonData.adults = this.extractGuestCount(guestCounts, 'ADULT');
    jsonData.children = this.extractGuestCount(guestCounts, 'CHILD');

    // Extracting roomtype, ratecode, and rateamount
    jsonData.roomtype = this.extractAttributeValue(
      xmlData,
      'hc:RoomType',
      'roomTypeCode',
    );
    jsonData.ratecode = this.extractAttributeValue(
      xmlData,
      'hc:RoomRate',
      'ratePlanCode',
    );
    jsonData.rateamount = {
      amount: parseInt(this.extractValue(xmlData, 'hc:Base'), 10) || null,
      currency: this.extractAttributeValue(xmlData, 'hc:Base', 'currencyCode'),
    };

    // Extracting guarantee and method_payment
    jsonData.guarantee = this.extractAttributeValue(
      xmlData,
      'hc:Guarantee',
      'guaranteeType',
    );
    jsonData.method_payment = this.extractAttributeValue(
      xmlData,
      'hc:PaymentType',
      'type',
    );

    // Extracting booking_balance
    jsonData.booking_balance = this.extractValue(xmlData, 'hc:CurrentBalance');

    return jsonData;
  }

  private extractValue(xmlData: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 'i');
    const match = xmlData.match(regex);
    return match ? match[1] : null;
  }

  private extractTagValues(xmlData: string, tagName: string): string[] {
    const regex = new RegExp(`<${tagName}[^>]*>(.*?)<\/${tagName}>`, 'gi');
    const matches = [];
    let match;
    while ((match = regex.exec(xmlData)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }

  private extractAttributeValue(
    xmlData: string,
    tagName: string,
    attributeName: string,
  ): string | null {
    const regex = new RegExp(
      `<${tagName}[^>]*${attributeName}="([^"]*)".*?>`,
      'i',
    );
    const match = xmlData.match(regex);
    return match ? match[1] : null;
  }

  private extractGuestCount(guestCounts: string[], type: string): number {
    const regex = new RegExp(
      `ageQualifyingCode="${type}"[^>]*count="(\\d+)"`,
      'i',
    );
    let count = 0;
    guestCounts.forEach((countTag) => {
      const match = countTag.match(regex);
      if (match) {
        count += parseInt(match[1], 10);
      }
    });
    return count;
  }

  private formatJson(jsonData: any): any {
    try {
      return {
        confirmation_no: jsonData.confirmation_no || null,
        resv_name_id: jsonData.resv_name_id || null,
        arrival: jsonData.arrival?.split('T')?.[0] || null,
        departure: jsonData.departure?.split('T')?.[0] || null,
        adults: jsonData.adults || 0,
        children: jsonData.children || 0,
        roomtype: jsonData.roomtype || null,
        ratecode: jsonData.ratecode || null,
        rateamount: jsonData.rateamount || null,
        guarantee: jsonData.guarantee || null,
        method_payment: jsonData.method_payment || null,
        computed_resv_status: jsonData.computed_resv_status || null,
        last_name: jsonData.last_name || null,
        first_name: jsonData.first_name || null,
        title: jsonData.title || null,
        phone_number: jsonData.phone_number || null,
        email: jsonData.email || null,
        booking_balance: jsonData.booking_balance || null,
        booking_created_date:
          jsonData.booking_created_date?.split('T')?.[0] || null,
      };
    } catch (error) {
      console.error('Error formatting JSON data:', error.message);
      throw new HttpException(
        'Error formatting JSON data.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
