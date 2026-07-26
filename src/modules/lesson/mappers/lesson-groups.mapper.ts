import { Injectable } from '@nestjs/common';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { ILessonGroupDictionaryItem } from '../models/lesson-groups/lesson-group-dictionary-item.model';

@Injectable()
export class LessonGroupsMapper {
  entityToDictionaryItem(entity: LessonsGroupEntity): ILessonGroupDictionaryItem {
    const { id, name, } = entity;
    return { id, name, };
  }

  entityToListItem(entity: LessonsGroupEntity): ILessonGroupListItemModel {
    const { id, name, note, } = entity;
    return {
      id, name, note,
    };
  }

  entityToItem(entity: LessonsGroupEntity): ILessonGroupItemModel {
    const { id, name, note, } = entity;
    return {
      id, name, note,
    };
  }
}
