import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Permission } from '../../../shared/models/permission.enum';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: 0, })
  rolePriority: number;

  @Column({
    type: 'enum',
    enum: Permission,
    array: true,
  })
  permissions: Permission[];

  @ManyToMany(() => UserEntity, user => user.roles)
  users: UserEntity[];
}
