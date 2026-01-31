import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { Repository } from 'typeorm';
import { IGetLessonGroupsFiltersModel } from '../models/lesson-groups/get-lesson-groups-filter.model';
import { LessonGroupsMapper } from '../mappers/lesson-groups.mapper';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';

@Injectable()
export class LessonsGroupsService {
  constructor(
    @InjectRepository(LessonsGroupEntity)
    private lessonGroupsRepository: Repository<LessonsGroupEntity>,
    private readonly lessonGroupsMapper: LessonGroupsMapper,
  ) {}

  async getAll(params: IGetLessonGroupsFiltersModel): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    const { page, pageSize, dateFrom, dateTo, group, teacher, } = params;
    const semQb = this.lessonGroupsRepository
      .createQueryBuilder('lsgroups')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (dateFrom) {
      semQb.andWhere('lsgroups.dateFrom >= :dateFrom', { dateFrom, });
    }
    if (dateTo) {
      semQb.andWhere('lsgroups.dateTo <= :dateTo', { dateTo, });
    }
    // if (search) {
    //   semQb.andWhere('sem.name LIKE :search', { search, });
    // }

    const [lsGroupsData, total] = await semQb
      .distinct(true)
      .getManyAndCount();

    return {
      items: lsGroupsData.map(
        (s) => this.lessonGroupsMapper.entityToListItem(s)
      ),
      meta: { count: total, },
    };
  }
}
