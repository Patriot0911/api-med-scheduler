import { LessonEntity } from 'src/modules/lesson/entities/lesson.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn, } from 'typeorm';

@Entity('student_groups')
export class StudentGroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  studyYear: string;

  // очне / заочне * уточнити
  @Column({ nullable: true, })
  studySpecification: string;

  @ManyToMany(() => LessonEntity, (lesson) => lesson.studentGroups)
  lessons: LessonEntity[];
}
