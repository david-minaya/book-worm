import { Chat } from '../ai/entities/chat.entity';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, Column } from 'typeorm';

@Entity()
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  date: Date;

  @Column()
  email: string;
  
  @Column()
  password: string;

  @OneToMany(() => Chat, chat => chat.user)
  chats: Chat[];
}
