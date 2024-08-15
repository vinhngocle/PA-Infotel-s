import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayloadDto } from 'src/dtos/auth/AuthPayloadDto';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Res() res: Response, @Body() authDto: AuthPayloadDto) {
    const result = await this.authService.signIn(authDto, res);
    return res.status(200).json(result);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = this.authService.refreshTokens(refreshToken, res);
    return res.status(200).json(result);
  }
}
