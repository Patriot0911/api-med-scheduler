import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { TeacherLessonEntity } from 'src/modules/lesson/entities/teacher-lesson.entity';

@Entity('teachers')
export class TeacherEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => UserEntity, (user) => user.teacher, { onDelete: 'CASCADE', })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id', unique: true, })
  userId: string;

  @OneToMany(() => TeacherLessonEntity, (teacherLesson) => teacherLesson.teacher)
  teacherLessons: TeacherLessonEntity[];
}
