import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { LessonEntity } from './lesson.entity';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';
import { DepartmentEntity } from 'src/modules/departments/entities/department.entity';

@Entity('lessons_group')
export class LessonsGroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true, })
  note: string | null;

  @OneToMany(() => LessonEntity, (lesson) => lesson.lessonGroup)
  lessons: LessonEntity[];

  @ManyToOne(() => TeacherEntity, { nullable: true, onDelete: 'SET NULL', })
  @JoinColumn({ name: 'created_by_teacher_id' })
  createdByTeacher?: TeacherEntity | null;

  @Column({ name: 'created_by_teacher_id', type: 'uuid', nullable: true, })
  createdByTeacherId: string | null;

  @ManyToOne(() => DepartmentEntity, { nullable: true, onDelete: 'SET NULL', })
  @JoinColumn({ name: 'department_id' })
  department?: DepartmentEntity | null;

  @Column({ name: 'department_id', type: 'uuid', nullable: true, })
  departmentId: string | null;
}
