import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, } from 'typeorm';
import { GroupTagEntity } from './group-tags.entity';
import { StudentGroupLessonEntity } from 'src/modules/lesson/entities/student-group-lesson.entity';

@Entity('student_groups')
export class StudentGroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  studyYear: string;

  @ManyToMany(() => GroupTagEntity, (groupTag) => groupTag.studentGroups)
  @JoinTable({
    name: 'student_group_tags',
    joinColumn: { name: 'student_group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'group_tag_id', referencedColumnName: 'id' },
  })
  groupTags: GroupTagEntity[];

  @OneToMany(() => StudentGroupLessonEntity, (studentGroupLesson) => studentGroupLesson.studentGroup)
  studentGroupLessons: StudentGroupLessonEntity[];
}
