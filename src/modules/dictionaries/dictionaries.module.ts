import { Module } from '@nestjs/common';
import { DictionariesController } from './controllers/dictionaries.controller';
import { RolesModule } from '../roles/roles.module';
import { DictionariesService } from './services/dictionaries.service';
import { SemesterModule } from '../semester/semester.module';

@Module({
  imports: [
    RolesModule,
    SemesterModule
  ],
  controllers: [DictionariesController,],
  providers: [DictionariesService,],
  exports: [],
})
export class DictionariesModule {}
