import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { TeacherLessonEntity } from 'src/modules/lesson/entities/teacher-lesson.entity';
import { DepartmentEntity } from 'src/modules/departments/entities/department.entity';

@Entity('teachers')
export class TeacherEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => UserEntity, (user) => user.teacher, { onDelete: 'CASCADE', })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id', unique: true, })
  userId: string;

  @ManyToOne(() => DepartmentEntity, (department) => department.teachers, { nullable: true, onDelete: 'SET NULL', })
  @JoinColumn({ name: 'department_id' })
  department?: DepartmentEntity | null;

  @Column({ name: 'department_id', type: 'uuid', nullable: true, })
  departmentId: string | null;

  @OneToOne(() => DepartmentEntity, (department) => department.headTeacher)
  headedDepartment?: DepartmentEntity | null;

  @OneToMany(() => TeacherLessonEntity, (teacherLesson) => teacherLesson.teacher)
  teacherLessons: TeacherLessonEntity[];
}
