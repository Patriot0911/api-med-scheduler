import { Injectable } from '@nestjs/common';
import { StudentGroupEntity } from '../entities/student-group.entity';
import { IStudentGroupItemModel } from '../models/student-group-item.model';
import { IStudentGroupListItemModel } from '../models/student-group-list-item.model';
import { IGroupDictionaryItem } from '../models/group-dictionary-item.model';

@Injectable()
export class StudentGroupsMapper {
  entityToDictionaryItem(group: StudentGroupEntity): IGroupDictionaryItem {
    const { id, name, } = group;
    return { id, name, };
  }

  entityToListItem(group: StudentGroupEntity): IStudentGroupListItemModel {
    const { id, name, studyYear, groupTags, } = group;
    return { id, name, studyYear, groupTags: groupTags.map(tag => tag.id), };
  }

  entityToItem(group: StudentGroupEntity): IStudentGroupItemModel {
    const { id, name, studyYear, groupTags } = group;
    return { id, name, studyYear, groupTags: groupTags.map(tag => tag.id), };
  }
}
