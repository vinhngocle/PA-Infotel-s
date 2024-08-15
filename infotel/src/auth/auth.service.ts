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

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private _userRepository: Repository<User>,
  ) {}

  async signIn(authPayloadDto: AuthPayloadDto) {
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

      return tokens;
    }
  }

  private async getTokens(userId: number, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: 'JWT_ACCESS_SECRET',
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: 'JWT_REFRESH_SECRET',
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
}
