import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { LessonsGroupEntity } from './lessons-group.entity';
import { SemesterEntity } from 'src/modules/semester/entities/semester.entity';
import { StudentGroupLessonEntity } from './student-group-lesson.entity';
import { TeacherLessonEntity } from './teacher-lesson.entity';
import { LessonVisibility } from '../models/lesson-visibility.enum';
import { LessonDepartmentEntity } from './lesson-department.entity';

@Entity('lessons')
export class LessonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz', nullable: true, })
  date: Date;

  @Column({ type: 'int', })
  duration: number;

  @Column({ type: 'timestamptz', nullable: true, })
  delayedDate: Date;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true, })
  note: string | null;

  @OneToMany(() => StudentGroupLessonEntity, (studentGroupLesson) => studentGroupLesson.lesson)
  studentGroupLessons: StudentGroupLessonEntity[];

  @OneToMany(() => TeacherLessonEntity, (teacherLesson) => teacherLesson.lesson)
  teacherLessons: TeacherLessonEntity[];

  @ManyToOne(() => SemesterEntity, (semester) => semester.lessons, { nullable: true })
  @JoinColumn({ name: 'semester_id' })
  semester: SemesterEntity;

  @Column({ name: 'semester_id', nullable: true })
  semesterId?: string;

  // optional: a series or lessons that belong together; deleting the group keeps the lesson
  @ManyToOne(() => LessonsGroupEntity, (group) => group.lessons, { nullable: true, onDelete: 'SET NULL', })
  @JoinColumn({ name: 'lesson_group_id' })
  lessonGroup?: LessonsGroupEntity | null;

  @Column({ name: 'lesson_group_id', type: 'uuid', nullable: true, })
  lessonGroupId: string | null;

  // the head of each of them may edit the lesson
  @OneToMany(() => LessonDepartmentEntity, (lessonDepartment) => lessonDepartment.lesson)
  lessonDepartments: LessonDepartmentEntity[];

  @Column({
    type: 'enum',
    enum: LessonVisibility,
    default: LessonVisibility.ALL,
  })
  visibility: LessonVisibility;
}
