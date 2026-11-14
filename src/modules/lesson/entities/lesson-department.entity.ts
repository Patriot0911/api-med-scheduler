import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { DepartmentEntity } from 'src/modules/departments/entities/department.entity';
import { LessonEntity } from './lesson.entity';

// constraint names match the migration, so synchronize (dev) and migrations build the same schema
@Entity('lesson_departments')
@Unique('UQ_lesson_departments_lesson_department', ['lessonId', 'departmentId'])
export class LessonDepartmentEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_lesson_departments', })
  id: string;

  @ManyToOne(() => LessonEntity, (lesson) => lesson.lessonDepartments, { onDelete: 'CASCADE', })
  @JoinColumn({ name: 'lesson_id', foreignKeyConstraintName: 'FK_lesson_departments_lesson_id', })
  lesson: LessonEntity;

  @Column({ name: 'lesson_id', type: 'uuid', })
  lessonId: string;

  @ManyToOne(() => DepartmentEntity, { onDelete: 'CASCADE', })
  @JoinColumn({ name: 'department_id', foreignKeyConstraintName: 'FK_lesson_departments_department_id', })
  department: DepartmentEntity;

  @Column({ name: 'department_id', type: 'uuid', })
  departmentId: string;
}
