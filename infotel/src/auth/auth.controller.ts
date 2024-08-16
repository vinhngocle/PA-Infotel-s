import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayloadDto } from 'src/dtos/auth/AuthPayloadDto';
import { Response, Request } from 'express';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { RefreshTokenGuard } from 'src/common/guards/refreshToken.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Res() res: Response, @Body() authDto: AuthPayloadDto) {
    const result = await this.authService.signIn(authDto, res);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res
      .status(HttpStatus.OK)
      .json({ message: 'Login successfull', data: result });
  }

  @UseGuards(AccessTokenGuard)
  @Get('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    this.authService.logout(req.user['sub']);

    return res.status(HttpStatus.OK).json({ message: 'Logout successful' });
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];

    const newTokens = await this.authService.refreshTokens(
      userId,
      refreshToken,
    );

    res.cookie('access_token', newTokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', newTokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res
      .status(HttpStatus.OK)
      .json({ message: 'Tokens refreshed', data: newTokens });
  }
}
