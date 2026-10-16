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
    return this.entityToItem(entity);
  }

  entityToItem(entity: LessonsGroupEntity): ILessonGroupItemModel {
    const { id, name, note, createdByTeacherId, departmentId, } = entity;
    return {
      id, name, note,
      createdByTeacherId: createdByTeacherId ?? null,
      departmentId: departmentId ?? null,
    };
  }
}
