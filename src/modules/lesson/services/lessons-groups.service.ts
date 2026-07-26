import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { Repository } from 'typeorm';
import { IGetLessonGroupsFiltersModel } from '../models/lesson-groups/get-lesson-groups-filter.model';
import { LessonGroupsMapper } from '../mappers/lesson-groups.mapper';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { ICreateLessonGroupModel } from '../models/lesson-groups/create-lesson-group.model';
import { IEditLessonGroupModel } from '../models/lesson-groups/edit-lesson-group.model';
import { ILessonGroupDictionaryItem } from '../models/lesson-groups/lesson-group-dictionary-item.model';

@Injectable()
export class LessonsGroupsService {
  constructor(
    @InjectRepository(LessonsGroupEntity)
    private lessonGroupsRepository: Repository<LessonsGroupEntity>,
    private readonly lessonGroupsMapper: LessonGroupsMapper,
  ) {}

  async getLessonGroupsDictionary(): Promise<ILessonGroupDictionaryItem[]> {
    const lessonGroups = await this.lessonGroupsRepository.find({
      select: ['id', 'name',]
    });
    return lessonGroups.map(
      (g) => this.lessonGroupsMapper.entityToDictionaryItem(g)
    );
  }

  async getAll(params: IGetLessonGroupsFiltersModel): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    const { page, pageSize, search, } = params;
    const lessonGroupsQb = this.lessonGroupsRepository
      .createQueryBuilder('lsgroups')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      lessonGroupsQb.andWhere('lsgroups.name LIKE :search', { search, });
    }

    const [lsGroupsData, total] = await lessonGroupsQb
      .distinct(true)
      .getManyAndCount();

    return {
      items: lsGroupsData.map(
        (s) => this.lessonGroupsMapper.entityToListItem(s)
      ),
      meta: { count: total, },
    };
  }

  async getById(lessonGroupId: string): Promise<ILessonGroupItemModel> {
    const lessonGroup = await this.lessonGroupsRepository.findOneOrFail({
      where: { id: lessonGroupId, }
    });
    return this.lessonGroupsMapper.entityToItem(lessonGroup);
  }

  async createLessonGroup(data: ICreateLessonGroupModel): Promise<ILessonGroupItemModel> {
    const newLessonGroup = this.lessonGroupsRepository.create({
      name: data.name,
      note: data.note,
    },);
    const createdLessonGroup = await this.lessonGroupsRepository.save(newLessonGroup);
    return this.lessonGroupsMapper.entityToItem(createdLessonGroup);
  }

  async editLessonGroup(data: IEditLessonGroupModel, lessonGroupId: string): Promise<boolean> {
    const updatedLessonGroup = await this.lessonGroupsRepository.update(
      { id: lessonGroupId, },
      {
        name: data.name,
        note: data.note,
      },
    );
    return !!updatedLessonGroup.affected;
  }

  async deleteLessonGroup(lessonGroupId: string): Promise<ILessonGroupItemModel> {
    const lessonGroupData = await this.lessonGroupsRepository.findOneOrFail({
      where: { id: lessonGroupId, }
    });
    const removedLessonGroup = await this.lessonGroupsRepository.remove(lessonGroupData);
    return this.lessonGroupsMapper.entityToItem(removedLessonGroup);
  }
}
