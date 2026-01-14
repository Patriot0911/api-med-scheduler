import { Column, Entity, ManyToMany, PrimaryGeneratedColumn, } from 'typeorm';
import { StudentGroupEntity } from './student-group.entity';

@Entity('group_tags')
export class GroupTagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToMany(() => StudentGroupEntity, (studentGroup) => studentGroup.groupTags)
  studentGroups: StudentGroupEntity[];
}
