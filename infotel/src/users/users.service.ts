import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from 'src/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserSaveDto } from 'src/dtos/user/UserSaveDto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private _userRepository: Repository<User>,
  ) {}

  async create(userSaveDto: UserSaveDto) {
    const user = await this.getUserByEmail(userSaveDto.email);
    if (user) {
      throw new HttpException('User already exists.', HttpStatus.BAD_REQUEST);
    }

    const hashPassword = await bcrypt.hash(userSaveDto.password, 10);
    const newUser = this._userRepository.create({
      email: userSaveDto.email,
      password: hashPassword,
    });
    await this._userRepository.save(newUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...usersWithoutPassword } = newUser;
    return usersWithoutPassword;
  }

  getUserByEmail(email: string) {
    return this._userRepository.findOneBy({
      email,
    });
  }
}
