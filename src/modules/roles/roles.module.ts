import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './entities/role.entity';
import { RolesService } from './services/roles.service';
import { RolesController } from './controllers/roles.controller';
import { UsersModule } from '../users/users.module';
import { RolesMapper } from './mappers/roles.mapper';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      RoleEntity,
    ]),
  ],
  controllers: [RolesController,],
  providers: [
    RolesService,
    RolesMapper,
  ],
  exports: [RolesService,],
})
export class RolesModule {}
