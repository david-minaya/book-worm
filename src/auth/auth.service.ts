import * as bcrypt from 'bcrypt';
import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserDto } from '../users/user.dto';

@Injectable()
export class AuthService {
  
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signUp(email: string, password: string) {

    const exists = await this.usersService.findByEmail(email);

    if (exists) {
      throw new ConflictException();
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create(email, hashPassword);

    return {
      access_token: this.jwtService.sign({ id: user.id, email: user.email }),
    };
  }

  async validateUser(email: string, password: string): Promise<UserDto|null> {

    const user = await this.usersService.findByEmail(email);
    
    if (user && await bcrypt.compare(password, user.password)) {
      return {
        id: user.id,
        email: user.email
      };
    }
    
    return null;
  }

  async login(user: UserDto) {
    return {
      access_token: this.jwtService.sign({ id: user.id, email: user.email }),
    };
  }
}
