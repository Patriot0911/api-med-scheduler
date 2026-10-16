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
import { DepartmentLessonsService } from './services/department-lessons.service';
import { DepartmentLessonsController } from './controllers/department-lessons.controller';
import { DepartmentLessonGroupsService } from './services/department-lesson-groups.service';
import { DepartmentLessonGroupsController } from './controllers/department-lesson-groups.controller';
import { MyLessonsService } from './services/my-lessons.service';
import { MyLessonsController } from './controllers/my-lessons.controller';
import { StudentEntity } from '../users/entities/student.entity';
import { DepartmentEntity } from '../departments/entities/department.entity';

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
    MyLessonsController,
    LessonsGroupsController,
    DepartmentLessonsController,
    DepartmentLessonGroupsController,
  ],
  providers: [
    LessonsGroupsService,
    LessonGroupsMapper,
    LessonsService,
    LessonsMapper,
    LessonAccessService,
    DepartmentLessonsService,
    DepartmentLessonGroupsService,
    MyLessonsService,
  ],
  exports: [
    LessonsService,
    LessonsGroupsService,
  ],
})
export class LessonModule {}
