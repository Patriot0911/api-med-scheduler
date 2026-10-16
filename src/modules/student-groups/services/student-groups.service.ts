import { Injectable } from '@nestjs/common';
import { IGetStudentGroupsFiltersModel } from '../models/get-student-groups-filters.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentGroupEntity } from '../entities/student-group.entity';
import { In, Repository } from 'typeorm';
import { StudentGroupsMapper } from '../mappers/student-groups.mapper';
import { IStudentGroupListItemModel } from '../models/student-group-list-item.model';
import { ICreateStudentGroupModel } from '../models/create-student-group.model';
import { IEditStudentGroupModel } from '../models/edit-student-group.model';
import { GroupTagEntity } from '../entities/group-tags.entity';
import { IGroupDictionaryItem } from '../models/group-dictionary-item.model';

@Injectable()
export class StudentGroupsService {
  constructor(
    @InjectRepository(StudentGroupEntity)
    private studentGroupsRepository: Repository<StudentGroupEntity>,
    @InjectRepository(GroupTagEntity)
    private groupTagsRepository: Repository<GroupTagEntity>,
    private readonly studentGroupsMapper: StudentGroupsMapper,
  ) {}

  async getGroupsDictionary(): Promise<IGroupDictionaryItem[]> {
    const groups = await this.studentGroupsRepository.find({
      select: ['id', 'name',]
    });
    return groups.map(
      (g) => this.studentGroupsMapper.entityToDictionaryItem(g)
    );
  }

  async getAll(params: IGetStudentGroupsFiltersModel): Promise<IGenericListPayloadResponse<IStudentGroupListItemModel>> {
    const { page, pageSize, search, tags } = params;
    const groupsQb = this.studentGroupsRepository
      .createQueryBuilder('groups')
      .leftJoinAndSelect('groups.groupTags', 'tags')
      .orderBy('groups.name', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      groupsQb.andWhere('groups.name ILIKE :search', { search: `%${search}%`, });
    }

    // filter through a subquery so the joined tags of a matching group stay complete
    if (tags && tags.length > 0) {
      groupsQb.andWhere(
        'EXISTS (SELECT 1 FROM student_group_tags fsgt WHERE fsgt.student_group_id = groups.id AND fsgt.group_tag_id IN (:...tags))',
        { tags, },
      );
    }

    const [groupsData, total] = await groupsQb.getManyAndCount();

    return {
      items: groupsData.map(
        (r) => this.studentGroupsMapper.entityToListItem(r)
      ),
      meta: { count: total, },
    };
  }

  async getById(id: string) {
    const group = await this.studentGroupsRepository.findOneOrFail({
      where: { id, },
      relations: { groupTags: true, },
    });
    return this.studentGroupsMapper.entityToItem(group);
  }

  async createGroup(data: ICreateStudentGroupModel) {
    const tags = await this.findTags(data.tagIds);
    const newGroup = this.studentGroupsRepository.create({
      name: data.name,
      studyYear: data.studyYear,
      groupTags: tags,
    },);
    const createdGroup = await this.studentGroupsRepository.save(newGroup);
    return this.studentGroupsMapper.entityToItem(createdGroup);
  }

  async editStudentGroup(groupData: IEditStudentGroupModel, studentGroupId: string) {
    // many-to-many can't go through repository.update(): load, assign and save
    const group = await this.studentGroupsRepository.findOneOrFail({
      where: { id: studentGroupId, },
    });
    group.name = groupData.name;
    group.studyYear = groupData.studyYear;
    group.groupTags = await this.findTags(groupData.tagIds);
    await this.studentGroupsRepository.save(group);
    return true;
  }

  async deleteGroup(studentGroupId: string) {
    const studentGroupData = await this.studentGroupsRepository.findOneOrFail({
      where: { id: studentGroupId, },
      relations: { groupTags: true, },
    });
    const removedStudentGroup = await this.studentGroupsRepository.remove(studentGroupData);
    return this.studentGroupsMapper.entityToItem({ ...removedStudentGroup, id: studentGroupId, });
  }

  private async findTags(tagIds: string[]): Promise<GroupTagEntity[]> {
    if (tagIds.length === 0) {
      return [];
    }
    return await this.groupTagsRepository.find({
      where: { id: In(tagIds), },
    });
  }
}
