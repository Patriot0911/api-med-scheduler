import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Permission } from '../models/permission.enum';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: Permission,
    array: true,
  })
  permissions: Permission[];
}
