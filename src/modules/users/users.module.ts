import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { UsersService } from './services/users.service';
import { PasswordResetService } from './services/password-reset.service';
import { UsersMapper } from './mappers/user.mapper';
import { UsersController } from './controllers/users.controller';
import { RoleEntity } from '../roles/entities/role.entity';
import { RolesModule } from '../roles/roles.module';
import { PasswordService } from '../auth/services/password.service';

@Module({
  imports: [
    RolesModule,
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      PasswordResetTokenEntity,
    ]),
  ],
  controllers: [
    UsersController,
  ],
  providers: [
    UsersService,
    UsersMapper,
    PasswordResetService,
    PasswordService,
  ],
  exports: [
    UsersService,
    PasswordResetService,
  ],
})
export class UsersModule {}
