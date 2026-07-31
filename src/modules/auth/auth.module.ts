import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { PasswordService } from './services/password.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { AuthService } from './services/auth.service';
import { RolesModule } from '../roles/roles.module';
import { RoleEntity } from '../roles/entities/role.entity';
import { AuthMapper } from './mappers/auth.mapper';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    RolesModule,
    UsersModule,
    JwtModule,
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    JwtService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    AuthMapper,
  ],
  exports: [],
})
export class AuthModule {}
