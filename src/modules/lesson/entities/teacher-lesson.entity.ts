import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LessonEntity } from './lesson.entity';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';

@Entity('teacher_lesson')
@Index('UQ_teacher_lesson_owner', ['lessonId'], { unique: true, where: '"is_owner" = true', })
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

  // The single owner of the lesson; the lesson belongs to the owner's department.
  @Column({ name: 'is_owner', default: false, })
  isOwner: boolean;

  // Granted by the owner: this co-teacher may edit the lesson.
  @Column({ name: 'can_edit', default: false, })
  canEdit: boolean;
}
