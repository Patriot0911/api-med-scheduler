import { Injectable } from '@nestjs/common';
import { DepartmentEntity } from '../entities/department.entity';
import { IDepartmentDictionaryItem } from '../models/department-dictionary-item.model';
import { IDepartmentItemModel } from '../models/department-item.model';
import { IDepartmentListItemModel } from '../models/department-list-item.model';

@Injectable()
export class DepartmentsMapper {
  entityToDictionaryItem(entity: DepartmentEntity): IDepartmentDictionaryItem {
    const { id, name, } = entity;
    return { id, name, };
  }

  entityToListItem(entity: DepartmentEntity): IDepartmentListItemModel {
    return this.entityToItem(entity);
  }

  entityToItem(entity: DepartmentEntity): IDepartmentItemModel {
    const { id, name, } = entity;
    return { id, name, };
  }
}
