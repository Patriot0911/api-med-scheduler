import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonEntity } from './entities/lesson.entity';
import { LessonsGroupEntity } from './entities/lessons-group.entity';
import { LessonsGroupsService } from './services/lessons-groups.service';
import { LessonsService } from './services/lessons.service';
import { LessonsController } from './controllers/lessons.controller';
import { LessonsGroupsController } from './controllers/lessons-groups.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonEntity,
      LessonsGroupEntity,
    ]),
  ],
  controllers: [
    LessonsController,
    LessonsGroupsController,
  ],
  providers: [
    LessonsGroupsService,
    LessonsService,
  ],
  exports: [],
})
export class LessonModule {}
