import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  
  constructor(
    @InjectRepository(User)
    private users: Repository<User>
  ) {}

  async create(email: string, password: string) {
    return this.users.save({ email, password });
  }

  async findByEmail(email: string) {
    return this.users.findOneBy({ email });
  }
}
