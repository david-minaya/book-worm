import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class File {

  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  date: Date;

  @Column()
  name: string;

  @Column()
  mimeType: string;

  @Column()
  uri: string;

  @Column('text')
  content: string;

  @OneToOne(() => Message, message => message.file)
  @JoinColumn()
  message: Message;
}
