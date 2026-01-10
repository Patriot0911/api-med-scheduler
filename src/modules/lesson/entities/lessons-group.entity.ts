import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LessonEntity } from './lesson.entity';

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
}
