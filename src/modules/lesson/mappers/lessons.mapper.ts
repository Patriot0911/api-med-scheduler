import { Injectable } from '@nestjs/common';
import { LessonEntity } from '../entities/lesson.entity';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';

@Injectable()
export class LessonsMapper {
  // entityToDictionaryItem(entity: LessonsGroupEntity): ISemesterDictionaryItem {
  //   const { id, name, } = entity;
  //   return { id, name, };
  // }
  entityToListItem(entity: LessonEntity): ILessonListItemModel {
    const { name, id, date, } = entity;
    return {
      name, id, date,
    };
  }

  entityToItem(entity: LessonEntity): ILessonItemModel {
    const { date, name, id, } = entity;
    return {
      name, id, date,
    };
  }
}
