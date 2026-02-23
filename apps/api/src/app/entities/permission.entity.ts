import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  task!: Task;

  @Column()
  taskId!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user!: User;

  @Column()
  userId!: string;

  @Column({ default: false })
  canEdit!: boolean;

  @Column({ default: false })
  canDelete!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;
}
