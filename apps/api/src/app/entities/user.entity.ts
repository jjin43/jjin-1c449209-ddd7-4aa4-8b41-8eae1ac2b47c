import { Role } from '@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/data'; // adjust import path if needed
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from './organization.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'text' })
  role!: Role;

  @ManyToOne(() => Organization, { eager: true })
  organization!: Organization;

  @Column()
  organizationId!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;
}
