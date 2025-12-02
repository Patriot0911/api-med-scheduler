import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private lessonsRepository: Repository<LessonEntity>,
  ) {}

  async getAllLessons() {
  };
}
