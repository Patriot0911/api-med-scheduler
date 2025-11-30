import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { UsersMapper } from './mappers/user.mapper';
import { RoleEntity } from '../roles/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity]),
  ],
  controllers: [],
  providers: [
    UsersService,
    UsersMapper,
  ],
  exports: [
    UsersService,
  ],
})
export class UsersModule {}
