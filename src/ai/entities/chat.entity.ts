import { Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, CreateDateColumn } from 'typeorm';
import { Message } from './message.entity';
import { User } from '../../users/user.entity';

@Entity()
export class Chat {

  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  date: Date;

  @OneToMany(() => Message, message => message.chat, { cascade: true })
  messages: Message[];

  @ManyToOne(() => User, user => user.chats)
  user: User;
}
