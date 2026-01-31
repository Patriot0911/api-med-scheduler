import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';
import { IGetLessonsFiltersModel } from '../models/lessons/get-lessons-filter.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { LessonsMapper } from '../mappers/lessons.mapper';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ICreateLessonModel } from '../models/lessons/create-lesson.model';
import { IEditLessonModel } from '../models/lessons/edit-lesson.model';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private lessonsRepository: Repository<LessonEntity>,
    private readonly lessonsMapper: LessonsMapper,
  ) {}

  async getAll(params: IGetLessonsFiltersModel): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    const { page, pageSize, dateFrom, dateTo, group, teacher, } = params;
    const semQb = this.lessonsRepository
      .createQueryBuilder('ls')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (dateFrom) {
      semQb.andWhere('(ls.date >= :dateFrom)', { dateFrom, });
    }
    if (dateTo) {
      semQb.andWhere('(ls.date <= :dateTo)', { dateTo, });
    }

    const [lsData, total] = await semQb
      .distinct(true)
      .getManyAndCount();

    return {
      items: lsData.map(
        (s) => this.lessonsMapper.entityToListItem(s)
      ),
      meta: { count: total, },
    };
  };

  async getById(id: string): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id, }
    });
    return this.lessonsMapper.entityToItem(lesson);
  }

  async createLesson(data: ICreateLessonModel) {
    const newLesson = this.lessonsRepository.create({
      ...data,
    },);
    const createdSemester = await this.lessonsRepository.save(newLesson);
    return this.lessonsMapper.entityToItem(createdSemester);
  }

  async editLesson(lessonId: string, data: IEditLessonModel): Promise<boolean> {
    const updatedLesson = await this.lessonsRepository.update(
      { id: lessonId, },
      { ...data, },
    );
    return !!updatedLesson.affected;
  }

  async deleteLesson(lessonId: string): Promise<void> {
    const lessonData = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, }
    });
    await this.lessonsRepository.remove(lessonData);
  }
}
