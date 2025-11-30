import { Module } from '@nestjs/common';
import { DictionariesController } from './controllers/dictionaries.controller';
import { RolesModule } from '../roles/roles.module';
import { DictionariesService } from './services/dictionaries.service';

@Module({
  imports: [
    RolesModule,
  ],
  controllers: [DictionariesController,],
  providers: [
    DictionariesService,
  ],
  exports: [],
})
export class DictionariesModule {}
