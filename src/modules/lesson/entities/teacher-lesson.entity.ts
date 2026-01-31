import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LessonEntity } from './lesson.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';

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

  @ManyToOne(() => UserEntity, (user) => user.teacherLessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher: UserEntity;

  @Column({ name: 'teacher_id' })
  teacherId: string;
}
