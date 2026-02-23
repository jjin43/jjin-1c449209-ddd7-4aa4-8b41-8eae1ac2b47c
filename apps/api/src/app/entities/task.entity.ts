import { TaskStatus, Role } from '@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/data'; // adjust import path if needed
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string | null;

  @Column({ type: 'text', default: TaskStatus.TODO })
  status!: TaskStatus;

  @Column({ default: 'Work' })
  category!: string;

  @Column({ type: 'text', default: Role.VIEWER })
  role!: Role; // which role this task is intended for

  @ManyToOne(() => Organization, { eager: true })
  organization!: Organization;

  @Column()
  organizationId!: string;

  @ManyToOne(() => User, { eager: true })
  createdBy!: User;

  @Column()
  createdById!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: string;
}
