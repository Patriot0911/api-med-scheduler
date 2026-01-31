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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonEntity,
      LessonsGroupEntity,
      StudentGroupLessonEntity,
      TeacherLessonEntity,
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
  ],
  exports: [
    LessonsService,
    LessonsGroupsService,
  ],
})
export class LessonModule {}
