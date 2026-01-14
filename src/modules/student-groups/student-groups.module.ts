import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentGroupEntity } from './entities/student-group.entity';
import { StudentGroupsService } from './services/student-groups.service';
import { StudentGroupsMapper } from './mappers/student-groups.mapper';
import { StudentGroupsController } from './controllers/student-groups.controller';
import { GroupTagEntity } from './entities/group-tags.entity';
import { GroupTagsService } from './services/group-tags.service';
import { GroupTagsMapper } from './mappers/group-tags.mapper';
import { GroupTagsController } from './controllers/group-tags.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentGroupEntity,
      GroupTagEntity,
    ]),
  ],
  controllers: [
    StudentGroupsController,
    GroupTagsController,
  ],
  providers: [
    StudentGroupsService,
    StudentGroupsMapper,
    GroupTagsService,
    GroupTagsMapper,
  ],
  exports: [
    GroupTagsService,
    StudentGroupsService,
  ],
})
export class StudentGroupsModule {}
