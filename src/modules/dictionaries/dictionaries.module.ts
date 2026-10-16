import { Module } from '@nestjs/common';
import { DictionariesController } from './controllers/dictionaries.controller';
import { RolesModule } from '../roles/roles.module';
import { DictionariesService } from './services/dictionaries.service';
import { SemesterModule } from '../semester/semester.module';
import { StudentGroupsModule } from '../student-groups/student-groups.module';
import { LessonModule } from '../lesson/lesson.module';
import { DepartmentsModule } from '../departments/departments.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    RolesModule,
    SemesterModule,
    StudentGroupsModule,
    LessonModule,
    DepartmentsModule,
    UsersModule,
  ],
  controllers: [DictionariesController,],
  providers: [DictionariesService,],
  exports: [],
})
export class DictionariesModule {}
