import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentGroupEntity } from './entities/student-group.entity';
import { StudentGroupsService } from './services/student-groups.service';
import { StudentGroupsMapper } from './mappers/student-groups.mapper';
import { StudentGroupsController } from './controllers/student-groups.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentGroupEntity,
    ]),
  ],
  controllers: [
    StudentGroupsController,
  ],
  providers: [
    StudentGroupsService,
    StudentGroupsMapper,
  ],
  exports: [],
})
export class StudentGroupsModule {}
