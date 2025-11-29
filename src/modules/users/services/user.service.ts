import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async createUser(email: string, password: string, fullName: string): Promise<UserEntity> {
    const newUser = this.userRepository.create({
      email,
      password,
      fullName,
    },);
    return await this.userRepository.save(newUser);
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles',],
    });
    return user;
  }
  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }
}
