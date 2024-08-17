import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/entity/user.entity';
import { AccessTokenStrategy } from 'src/strategies/accessToken.strategy';
import { RefreshTokenStrategy } from 'src/strategies/refreshToken.strategy';
import { ConfigModule } from '@nestjs/config';
import { GoogleStrategy } from 'src/strategies/google.strategy';
import { PassportModule } from '@nestjs/passport';
import { SessionSerializer } from 'src/strategies/Serializer';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
    JwtModule.register({}),
    PassportModule.register({ session: true }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    SessionSerializer,
    GoogleStrategy,
    {
      provide: 'AUTH_SERVICE',
      useClass: AuthService,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
