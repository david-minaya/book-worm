import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, OneToOne } from 'typeorm';
import { Chat } from './chat.entity';
import { File } from './file.entity';
import { Prompt } from './prompt.entity';

@Entity()
export class Message {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['user', 'model']})
  role: 'user' | 'model';

  @CreateDateColumn()
  date: Date;

  @Column({ type: 'text', nullable: true })
  text: string;

  @OneToOne(() => Prompt, prompt => prompt.message, { cascade: true })
  prompt: Prompt;

  @OneToOne(() => File, file => file.message, { cascade: true, eager: true })
  file: File;

  @ManyToOne(() => Chat, chat => chat.messages)
  chat: Chat;
}
