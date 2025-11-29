import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { UserService } from '../users/services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { SessionService } from './services/session.service';
import { SessionEntity } from './entities/session.entity';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      SessionEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    UserService,
    SessionService,
    JwtService,
  ],
  exports: [],
})
export class AuthModule {}
