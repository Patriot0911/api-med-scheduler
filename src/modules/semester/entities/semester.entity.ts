import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

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
}
