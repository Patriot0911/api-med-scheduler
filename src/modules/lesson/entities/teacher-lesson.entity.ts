import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LessonEntity } from './lesson.entity';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';

@Entity('teacher_lesson')
export class TeacherLessonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LessonEntity, (lesson) => lesson.teacherLessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson_id' })
  lesson: LessonEntity;

  @Column({ name: 'lesson_id' })
  lessonId: string;

  @ManyToOne(() => TeacherEntity, (teacher) => teacher.teacherLessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher: TeacherEntity;

  @Column({ name: 'teacher_id' })
  teacherId: string;
}
