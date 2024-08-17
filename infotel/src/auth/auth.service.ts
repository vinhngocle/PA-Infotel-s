import {
  ForbiddenException,
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
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    @InjectRepository(User) private _userRepository: Repository<User>,
  ) {}

  async signIn(authPayloadDto: AuthPayloadDto) {
    const user = await this.usersService.getUserByEmail(authPayloadDto.email);
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

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

  async logout(userId: number) {
    return this._userRepository.update({ id: userId }, { refreshToken: null });
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this._userRepository.findOneBy({ id: userId });
    const matched = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!user || !user.refreshToken || !matched) {
      throw new ForbiddenException('Access Denied');
    }

    const newTokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, newTokens.refreshToken);

    return newTokens;
  }

  async getUserById(id: number) {
    return await this._userRepository.findOneBy({ id });
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
}
