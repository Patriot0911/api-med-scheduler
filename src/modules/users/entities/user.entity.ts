import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TeacherEntity } from './teacher.entity';
import { StudentEntity } from './student.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  fullName: string;

  @Column()
  password: string;

  @Column({ type: 'text', nullable: true, })
  refreshToken: string | null;

  @CreateDateColumn({ type: 'timestamptz', })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true, })
  lastLoginAt: Date | null;

  @ManyToMany(() => RoleEntity, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];

  @OneToOne(() => TeacherEntity, (teacher) => teacher.user)
  teacher?: TeacherEntity;

  @OneToOne(() => StudentEntity, (student) => student.user)
  student?: StudentEntity;
}
