import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserSaveDto } from 'src/dtos/user/UserSaveDto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  async createUser(@Body() userSaveDto: UserSaveDto, @Res() res: Response) {
    const result = await this.userService.create(userSaveDto);
    return res.status(HttpStatus.CREATED).json({
      message: 'Create successfull',
      data: result,
    });
  }
}
