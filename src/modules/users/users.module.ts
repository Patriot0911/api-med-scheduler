import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserService } from './services/user.service';
import { UserMapper } from './mappers/user.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [],
  providers: [
    UserService,
    UserMapper,
  ],
  exports: [
    UserService,
  ],
})
export class UsersModule {}
