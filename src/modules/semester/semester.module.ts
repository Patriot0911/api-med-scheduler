import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemesterEntity } from './entities/semester.entity';
import { SemestersService } from './services/semesters.service';
import { SemestersController } from './controllers/semesters.controller';
import { SemestersMapper } from './mappers/semesters.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([SemesterEntity]),
  ],
  controllers: [SemestersController,],
  providers: [
    SemestersService,
    SemestersMapper,
  ],
  exports: [SemestersService,],
})
export class SemesterModule {}
