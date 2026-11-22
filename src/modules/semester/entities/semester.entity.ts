import { LessonEntity } from 'src/modules/lesson/entities/lesson.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('semesters')
export class SemesterEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  dateFrom: Date;

  @Column()
  dateTo: Date;

  @OneToMany(() => LessonEntity, (lesson) => lesson.semester)
  lessons: LessonEntity[];
}
