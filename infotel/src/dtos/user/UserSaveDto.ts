import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserSaveDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  refreshToken: string;
}
