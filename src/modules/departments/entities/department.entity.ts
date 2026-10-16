import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('departments')
export class DepartmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true, })
  name: string;

  @OneToMany(() => TeacherEntity, (teacher) => teacher.department)
  teachers: TeacherEntity[];
}
