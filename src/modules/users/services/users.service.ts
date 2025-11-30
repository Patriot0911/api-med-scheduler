import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async createUser(email: string, password: string, fullName: string): Promise<UserEntity> {
    const newUser = this.usersRepository.create({
      email,
      password,
      fullName,
    },);
    return await this.usersRepository.save(newUser);
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles',],
    });
    return user;
  }
  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.usersRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }
}
