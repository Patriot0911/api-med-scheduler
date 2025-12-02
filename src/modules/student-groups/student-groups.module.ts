import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentGroupEntity } from './entities/student-group.entity';
import { StudentgroupsService } from './services/student-groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentGroupEntity,
    ]),
  ],
  controllers: [],
  providers: [
    StudentgroupsService,
  ],
  exports: [],
})
export class StudentGroupsModule {}
