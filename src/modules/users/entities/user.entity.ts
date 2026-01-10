import { LessonEntity } from 'src/modules/lesson/entities/lesson.entity';
import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';

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

  @ManyToMany(() => RoleEntity, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];

  @ManyToMany(() => LessonEntity, (lesson) => lesson.teachers)
  @JoinTable({
    name: 'user_lessons',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'lessonId', referencedColumnName: 'id' },
  })
  lessons: LessonEntity[];
}
