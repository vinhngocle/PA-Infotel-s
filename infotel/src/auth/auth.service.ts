import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/entity/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthPayloadDto } from 'src/dtos/auth/AuthPayloadDto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private _userRepository: Repository<User>,
  ) {}

  async signIn(authPayloadDto: AuthPayloadDto, res: Response) {
    const user = await this._userRepository.findOneBy({
      email: authPayloadDto.email,
    });
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

    if (user) {
      const isMatch = await bcrypt.compare(
        authPayloadDto.password,
        user.password,
      );
      if (!isMatch) {
        throw new UnauthorizedException();
      }

      const tokens = await this.getTokens(user.id, user.email);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      console.log('token');

      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      return { message: 'Login Sucessfully.', data: tokens };
    }
  }

  async refreshTokens(refreshToken: string, res: Response) {
    const decoded = await this.jwtService.verifyAsync(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET || 'JWT_REFRESH_SECRET',
    });

    const user = await this._userRepository.findOneBy({ id: decoded.sub });
    if (!user || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return { message: 'Tokens refreshed', data: tokens };
  }

  private async getTokens(userId: number, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: process.env.JWT_ACCESS_SECRET || 'JWT_ACCESS_SECRET',
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: process.env.JWT_REFRESH_SECRET || 'JWT_REFRESH_SECRET',
          expiresIn: '7d',
        },
      ),
    ]);
    return {
      id: userId,
      email,
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this._userRepository.update(
      { id: userId },
      {
        refreshToken: hashedRefreshToken,
      },
    );
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
    });
  }
}
