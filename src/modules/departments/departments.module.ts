import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentEntity } from './entities/department.entity';
import { DepartmentsService } from './services/departments.service';
import { DepartmentsController } from './controllers/departments.controller';
import { DepartmentsMapper } from './mappers/departments.mapper';
import { TeacherEntity } from '../users/entities/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DepartmentEntity, TeacherEntity,]),
  ],
  controllers: [DepartmentsController,],
  providers: [
    DepartmentsService,
    DepartmentsMapper,
  ],
  exports: [DepartmentsService,],
})
export class DepartmentsModule {}
