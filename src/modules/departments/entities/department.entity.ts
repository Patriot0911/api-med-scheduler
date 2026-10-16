import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('departments')
export class DepartmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true, })
  name: string;

  @OneToMany(() => TeacherEntity, (teacher) => teacher.department)
  teachers: TeacherEntity[];

  // The only head of the department. Must be a teacher of this department.
  @OneToOne(() => TeacherEntity, { nullable: true, onDelete: 'SET NULL', })
  @JoinColumn({ name: 'head_teacher_id' })
  headTeacher?: TeacherEntity | null;

  @Column({ name: 'head_teacher_id', type: 'uuid', nullable: true, unique: true, })
  headTeacherId: string | null;
}
