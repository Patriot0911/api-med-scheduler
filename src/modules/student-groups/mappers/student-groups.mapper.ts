import { Injectable } from '@nestjs/common';
import { StudentGroupEntity } from '../entities/student-group.entity';
import { IStudentGroupItemModel } from '../models/student-group-item.model';
import { IStudentGroupListItemModel } from '../models/student-group-list-item.model';

@Injectable()
export class StudentGroupsMapper {
  entityToListItem(group: StudentGroupEntity): IStudentGroupListItemModel {
    const { id, name, studyYear, studySpecification, } = group;
    return { id, name, studyYear, studySpecification, };
  }

  entityToItem(role: StudentGroupEntity): IStudentGroupItemModel {
    const { id, name, studyYear, studySpecification, } = role;
    return { id, name, studyYear, studySpecification, };
  }
}
