import { Injectable } from '@nestjs/common';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';

@Injectable()
export class LessonGroupsMapper {
  // entityToDictionaryItem(entity: LessonsGroupEntity): ISemesterDictionaryItem {
  //   const { id, name, } = entity;
  //   return { id, name, };
  // }

  entityToListItem(entity: LessonsGroupEntity): ILessonGroupListItemModel {
    const { name, id, } = entity;
    return {
      name, id,
    };
  }

  // entityToItem(entity: LessonsGroupEntity): ISemesterItemModel {
  //   const { dateFrom, dateTo, name, id, } = entity;
  //   return {
  //     name, id, dateFrom, dateTo,
  //   };
  // }
}
