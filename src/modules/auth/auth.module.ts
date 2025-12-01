import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { PasswordService } from './services/password.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { RolesModule } from '../roles/roles.module';
import { RoleEntity } from '../roles/entities/role.entity';

@Module({
  imports: [
    PassportModule,
    RolesModule,
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
  ],
  exports: [],
})
export class AuthModule {}
