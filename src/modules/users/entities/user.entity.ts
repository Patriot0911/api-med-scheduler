import { TeacherLessonEntity } from 'src/modules/lesson/entities/teacher-lesson.entity';
import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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

  @OneToMany(() => TeacherLessonEntity, (lesson) => lesson.teacher)
  teacherLessons: TeacherLessonEntity[];
}
