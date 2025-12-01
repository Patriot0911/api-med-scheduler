import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './entities/role.entity';
import { RolesService } from './services/roles.service';
import { RolesController } from './controllers/roles.controller';
import { UsersModule } from '../users/users.module';
import { RolesMapper } from './mappers/roles.mapper';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity,
      UserEntity,
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
