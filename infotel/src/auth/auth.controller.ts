import {
  Body,
  Controller,
  Get,
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
import { GoogleGuard } from 'src/common/guards/google.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

const TIME_ACCESS_TOKEN = 15 * 60 * 1000; // 15 minutes
const TIME_REFRESH_TOKEN = 7 * 24 * 60 * 60 * 1000; // 7 days

@ApiBearerAuth()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  async signIn(@Body() authDto: AuthPayloadDto, @Res() res: Response) {
    const result = await this.authService.signIn(authDto);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: TIME_ACCESS_TOKEN,
    });
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: TIME_REFRESH_TOKEN,
    });

    return res
      .status(HttpStatus.OK)
      .json({ message: 'Login successfull', data: result });
  }

  @UseGuards(AccessTokenGuard)
  @Get('logout')
  @ApiOperation({ summary: 'Logout' })
  logout(@Req() req: Request, @Res() res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    this.authService.logout(req.user['sub']);

    return res.status(HttpStatus.OK).json({ message: 'Logout successful' });
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  @ApiOperation({ summary: 'Refresh token' })
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
      maxAge: TIME_ACCESS_TOKEN,
    });
    res.cookie('refresh_token', newTokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: TIME_REFRESH_TOKEN,
    });

    return res
      .status(HttpStatus.OK)
      .json({ message: 'Tokens refreshed', data: newTokens });
  }

  @UseGuards(GoogleGuard)
  @Get('google/login')
  @ApiOperation({ summary: 'Google Login' })
  googleLogin() {
    return { message: 'Google Authentication' };
  }

  @UseGuards(GoogleGuard)
  @Get('google/redirect')
  @ApiOperation({ summary: 'Google Redirect' })
  googleRedirect(@Req() req: Request) {
    return { message: 'Google login successfull.', data: req.user };
  }
}
