import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @ManyToOne(() => Organization, (org) => org.children, { nullable: true })
  parent?: Organization | null;

  @OneToMany(() => Organization, (org) => org.parent)
  children?: Organization[];

  @Column({ nullable: true })
  parentId?: string | null;
}
