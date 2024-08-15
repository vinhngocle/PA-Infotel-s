import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserSaveDto } from 'src/dtos/user/UserSaveDto';

@Controller('users')
export class UserController {
  constructor(private userService: UsersService) {}

  @Post()
  createUser(@Body() userSaveDto: UserSaveDto) {
    return this.userService.create(userSaveDto);
  }
}
