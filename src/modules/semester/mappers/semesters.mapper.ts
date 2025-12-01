import { Injectable } from '@nestjs/common';
import { SemesterEntity } from '../entities/semester.entity';
import { ISemesterItemModel } from '../models/semester-item.model';
import { ISemesterListItemModel } from '../models/semester-list-item.model';

@Injectable()
export class SemestersMapper {
  entityToListItem(entity: SemesterEntity): ISemesterListItemModel {
    const { dateFrom, dateTo, description, id, } = entity;
    return {
      description, id, dateFrom, dateTo,
    };
  }

  entityToItem(entity: SemesterEntity): ISemesterItemModel {
    const { dateFrom, dateTo, description, id, } = entity;
    return {
      description, id, dateFrom, dateTo,
    };
  }
}
