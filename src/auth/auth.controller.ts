import { Controller, Post, UseGuards, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './localAuth.guard';
import { SignUpDto } from './dtos/signUp.dto';
import { Public } from '../decorators/public.decorator';
import { User } from '../decorators/user.decorator';
import { UserDto } from '../users/user.dto';
import { ApiBody, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { AccessTokenDto } from './dtos/accessToken.dto';

@Controller('auth')
export class AuthController {

  constructor(private service: AuthService) {}
  
  @ApiBody({ type: SignUpDto })
  @ApiOkResponse({
    description: 'Login successful',
    type: AccessTokenDto
  })
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @HttpCode(200)
  async login(@User() user: UserDto) {
    return this.service.login(user);
  }

  @Public()
  @ApiCreatedResponse({
    description: 'User account created',
    type: AccessTokenDto
  })
  @Post('/signup')
  async signUp(@Body() body: SignUpDto) {
    return this.service.signUp(body.email, body.password);
  }
}
