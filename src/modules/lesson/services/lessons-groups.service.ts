import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LessonsGroupsService {
  constructor(
    @InjectRepository(LessonsGroupEntity)
    private lessonsRepository: Repository<LessonsGroupEntity>,
  ) {}
}
