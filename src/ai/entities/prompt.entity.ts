import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class Prompt {

  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  text: string;

  @OneToOne(() => Message, message => message.prompt)
  @JoinColumn()
  message: Message;
}
