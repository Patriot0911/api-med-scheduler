import { LessonEntity } from 'src/modules/lesson/entities/lesson.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn, } from 'typeorm';
import { GroupTagEntity } from './group-tags.entity';

@Entity('student_groups')
export class StudentGroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  studyYear: string;

  @ManyToMany(() => GroupTagEntity, (groupTag) => groupTag.studentGroups)
  groupTags: GroupTagEntity[];

  @ManyToMany(() => LessonEntity, (lesson) => lesson.studentGroups)
  lessons: LessonEntity[];
}
