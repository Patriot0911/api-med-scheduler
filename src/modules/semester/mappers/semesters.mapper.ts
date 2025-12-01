import { Injectable } from '@nestjs/common';
import { SemesterEntity } from '../entities/semester.entity';
import { ISemesterItemModel } from '../models/semester-item.model';
import { ISemesterListItemModel } from '../models/semester-list-item.model';
import { ISemesterDictionaryItem } from '../models/semester-dictionary-item.model';

@Injectable()
export class SemestersMapper {
  entityToDictionaryItem(entity: SemesterEntity): ISemesterDictionaryItem {
    const { id, name, } = entity;
    return { id, name, };
  }

  entityToListItem(entity: SemesterEntity): ISemesterListItemModel {
    const { dateFrom, dateTo, name, id, } = entity;
    return {
      name, id, dateFrom, dateTo,
    };
  }

  entityToItem(entity: SemesterEntity): ISemesterItemModel {
    const { dateFrom, dateTo, name, id, } = entity;
    return {
      name, id, dateFrom, dateTo,
    };
  }
}
