import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne } from 'typeorm';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { LessonsGroupEntity } from './lessons-group.entity';
import { SemesterEntity } from 'src/modules/semester/entities/semester.entity';
import { StudentGroupEntity } from 'src/modules/student-groups/entities/student-group.entity';

@Entity('lessons')
export class LessonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz', nullable: true, })
  date: Date;

  // minutes
  @Column({ type: 'int', })
  duration: number;

  @Column({ type: 'timestamptz', nullable: true, })
  delayedDate: Date;

  @Column()
  name: string;

  @Column({ nullable: true, })
  note: string;

  @ManyToMany(() => UserEntity, (user) => user.lessons)
  teachers: UserEntity[];

  @ManyToMany(() => StudentGroupEntity, (studentGroup) => studentGroup.lessons)
  studentGroups: StudentGroupEntity[];

  @ManyToOne(() => SemesterEntity, (semester) => semester.lessons)
  semester: SemesterEntity;

  @ManyToOne(() => LessonsGroupEntity, (group) => group.lessons)
  lessonGroup: LessonsGroupEntity;
}
