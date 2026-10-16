import { Injectable } from '@nestjs/common';
import { IGetStudentGroupsFiltersModel } from '../models/get-student-groups-filters.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GroupTagEntity } from '../entities/group-tags.entity';
import { ITagListItemModel } from '../models/tag-list-item.model';
import { GroupTagsMapper } from '../mappers/group-tags.mapper';
import { ICreateTagModel } from '../models/create-tag.model';
import { IEditTagModel } from '../models/edit-tag.model';
import { StudentGroupEntity } from '../entities/student-group.entity';
import { ITagStudentGroupItemModel } from '../models/tags-student-group-item.model';
import { IEditTagGroupsModel } from '../models/edit-tag-groups.model';
import { ITagDictionaryItem } from '../models/tag-dictionary-item.model';

@Injectable()
export class GroupTagsService {
  constructor(
    @InjectRepository(GroupTagEntity)
    private groupTagsRepository: Repository<GroupTagEntity>,
    @InjectRepository(StudentGroupEntity)
    private studentGroupsRepository: Repository<StudentGroupEntity>,
    private readonly groupTagsMapper: GroupTagsMapper,
  ) {}

  async getTagsDictionary(): Promise<ITagDictionaryItem[]> {
    const tags = await this.groupTagsRepository.find({
      select: ['id', 'name',]
    });
    return tags.map(
      (t) => this.groupTagsMapper.entityToDictionaryItem(t)
    );
  }

  async getAll(params: IGetStudentGroupsFiltersModel): Promise<IGenericListPayloadResponse<ITagListItemModel>> {
    const { page, pageSize, search, } = params;
    const tagsQb = this.groupTagsRepository
      .createQueryBuilder('tags')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      tagsQb.andWhere('tags.name ILIKE :search', { search: `%${search}%`, });
    }

    const [tagsData, total] = await tagsQb.getManyAndCount();

    return {
      items: tagsData.map(
        (t) => this.groupTagsMapper.entityToListItem(t)
      ),
      meta: { count: total, },
    };
  }

  async getById(id: string) {
    const tag = await this.groupTagsRepository.findOneOrFail({
      where: { id, }
    });
    return this.groupTagsMapper.entityToItem(tag);
  }

  async createTag(data: ICreateTagModel) {
    const newTag = this.groupTagsRepository.create({
      name: data.name,
    },);
    const createdTag = await this.groupTagsRepository.save(newTag);
    return this.groupTagsMapper.entityToItem(createdTag);
  }

  async editTag(tagData: IEditTagModel, tagId: string) {
    const updatedTag = await this.groupTagsRepository.update(
      { id: tagId, },
      { name: tagData.name, },
    );
    return !!updatedTag.affected;
  }

  async deleteTag(tagId: string) {
    const studentGroupData = await this.groupTagsRepository.findOneOrFail({
      where: { id: tagId, }
    });
    const removedTag = await this.groupTagsRepository.remove(studentGroupData);
    return this.groupTagsMapper.entityToItem(removedTag);
  }

  async getTagGroupsById(tagId: string): Promise<ITagStudentGroupItemModel[]> {
    const groups = await this.studentGroupsRepository.find({
      where: {
        groupTags: {
          id: tagId,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
    return groups;
  }

  async editTagGroups(tagId: string, data: IEditTagGroupsModel): Promise<boolean> {
    const tag = await this.groupTagsRepository.findOneOrFail({
      where: { id: tagId, },
      relations: { studentGroups: true, },
    });
    const groups = await this.studentGroupsRepository.find({
      where: { id: In(data.groups), },
    });
    tag.studentGroups = [
      ...groups,
    ];
    const updatedTag = await this.groupTagsRepository.save(tag);
    return !!updatedTag;
  }

  async addTagGroups(tagId: string, data: IEditTagGroupsModel): Promise<boolean> {
    const tag = await this.groupTagsRepository.findOneOrFail({
      where: { id: tagId, },
      relations: { studentGroups: true, },
    });
    const groupIdsToFind = data.groups.filter(gId => !tag.studentGroups.some(g => g.id === gId));
    const groups = await this.studentGroupsRepository.find({
      where: { id: In(groupIdsToFind), },
    });
    tag.studentGroups = [
      ...tag.studentGroups,
      ...groups,
    ];
    const updatedTag = await this.groupTagsRepository.save(tag);
    return !!updatedTag;
  }

  async deleteGroupFromTag(tagId: string, groupId: string): Promise<boolean> {
    const tag = await this.groupTagsRepository.findOneOrFail({
      where: { id: tagId, },
      relations: { studentGroups: true, },
    });
    tag.studentGroups = [
      ...tag.studentGroups.filter(g => g.id !== groupId),
    ];
    const updatedTag = await this.groupTagsRepository.save(tag);
    return !!updatedTag;
  }
}
