import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as xml2js from 'xml2js';

@Injectable()
export class BookingService {
  async convertXmlToJson(confirmationNo: string): Promise<any> {
    const filePath = join(`src/XML/${confirmationNo}.xml`);
    const xmlData = readFileSync(filePath, 'utf8');
    const parser = new xml2js.Parser();

    return await parser.parseStringPromise(xmlData);
  }

  async convertXmlToJsonNotUseThirdParty(xml: string): Promise<any> {
    xml = this.cleanXml(xml);
    const parseTag = (tag: string): string =>
      tag.replace(/<\/?(\w+).*>/g, '$1');

    const parser = (xml: string): any => {
      const obj: any = {};
      const tagRegex = /<(\w+)>((?:.|\n)*?)<\/\1>/g;
      let match;
      while ((match = tagRegex.exec(xml)) !== null) {
        const [, tagName, innerXml] = match;
        const parsedTag = parseTag(tagName);

        obj[parsedTag] = innerXml.trim();
        // obj[tagName] = parser(innerXml) || innerXml;
      }
      return Object.keys(obj).length ? obj : null;
    };
    return parser(xml);
  }

  private cleanXml(xml: string): string {
    return xml.replace(/<\?xml.*?\?>/g, '').trim();
  }
}
