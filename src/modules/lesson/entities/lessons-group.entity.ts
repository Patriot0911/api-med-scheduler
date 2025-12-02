import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LessonEntity } from './lesson.entity';

@Entity('lessons_group')
export class LessonsGroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, })
  note: string;

  @OneToMany(() => LessonEntity, (lesson) => lesson.lessonGroup)
  lessons: LessonEntity[];
}
