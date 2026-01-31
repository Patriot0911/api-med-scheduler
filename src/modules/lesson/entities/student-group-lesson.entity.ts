import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LessonEntity } from './lesson.entity';
import { StudentGroupEntity } from 'src/modules/student-groups/entities/student-group.entity';

@Entity('student_group_lesson')
export class StudentGroupLessonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LessonEntity, (lesson) => lesson.studentGroupLessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson_id' })
  lesson: LessonEntity;

  @Column({ name: 'lesson_id' })
  lessonId: string;

  @ManyToOne(() => StudentGroupEntity, (group) => group.studentGroupLessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_group_id' })
  studentGroup: StudentGroupEntity;

  @Column({ name: 'student_group_id' })
  studentGroupId: string;
}
