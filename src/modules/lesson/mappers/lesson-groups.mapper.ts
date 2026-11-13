import { Injectable } from '@nestjs/common';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { ILessonGroupDictionaryItem } from '../models/lesson-groups/lesson-group-dictionary-item.model';

export type ILessonGroupStats = Pick<ILessonGroupListItemModel, 'lessonsCount' | 'firstLessonDate' | 'lastLessonDate'>;

const EMPTY_STATS: ILessonGroupStats = { lessonsCount: 0, firstLessonDate: null, lastLessonDate: null, };

@Injectable()
export class LessonGroupsMapper {
  entityToDictionaryItem(entity: LessonsGroupEntity): ILessonGroupDictionaryItem {
    const { id, name, } = entity;
    return { id, name, };
  }

  entityToListItem(entity: LessonsGroupEntity, stats: ILessonGroupStats = EMPTY_STATS): ILessonGroupListItemModel {
    return {
      ...this.entityToItem(entity),
      departmentName: entity.department?.name ?? null,
      createdByTeacherName: entity.createdByTeacher?.user?.fullName ?? null,
      ...stats,
    };
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
