import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonEntity } from './entities/lesson.entity';
import { LessonsGroupEntity } from './entities/lessons-group.entity';
import { LessonsGroupsService } from './services/lessons-groups.service';
import { LessonsService } from './services/lessons.service';
import { LessonsController } from './controllers/lessons.controller';
import { LessonsGroupsController } from './controllers/lessons-groups.controller';
import { LessonGroupsMapper } from './mappers/lesson-groups.mapper';
import { LessonsMapper } from './mappers/lessons.mapper';
import { StudentGroupLessonEntity } from './entities/student-group-lesson.entity';
import { TeacherLessonEntity } from './entities/teacher-lesson.entity';
import { TeacherEntity } from '../users/entities/teacher.entity';
import { LessonAccessService } from './services/lesson-access.service';
import { MyLessonsService } from './services/my-lessons.service';
import { StudentEntity } from '../users/entities/student.entity';
import { DepartmentEntity } from '../departments/entities/department.entity';
import { ManagedLessonsService } from './services/managed-lessons.service';
import { ManagedLessonGroupsService } from './services/managed-lesson-groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonEntity,
      LessonsGroupEntity,
      StudentGroupLessonEntity,
      TeacherLessonEntity,
      TeacherEntity,
      StudentEntity,
      DepartmentEntity,
    ]),
  ],
  controllers: [
    LessonsController,
    LessonsGroupsController,
  ],
  providers: [
    LessonsGroupsService,
    LessonGroupsMapper,
    LessonsService,
    LessonsMapper,
    LessonAccessService,
    MyLessonsService,
    ManagedLessonsService,
    ManagedLessonGroupsService,
  ],
  exports: [
    LessonsService,
    LessonsGroupsService,
  ],
})
export class LessonModule {}
