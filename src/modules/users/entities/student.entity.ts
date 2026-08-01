import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { StudentGroupEntity } from 'src/modules/student-groups/entities/student-group.entity';

@Entity('students')
export class StudentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => UserEntity, (user) => user.student, { onDelete: 'CASCADE', })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id', unique: true, })
  userId: string;

  @ManyToOne(() => StudentGroupEntity, { nullable: true, })
  @JoinColumn({ name: 'student_group_id' })
  studentGroup: StudentGroupEntity | null;

  @Column({ name: 'student_group_id', nullable: true, })
  studentGroupId: string | null;

  @Column({ name: 'is_group_monitor', default: false, })
  isGroupMonitor: boolean;
}
