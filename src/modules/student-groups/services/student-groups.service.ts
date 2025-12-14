import { Injectable } from '@nestjs/common';
import { IGetStudentGroupsFiltersModel } from '../models/get-student-groups-filters.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentGroupEntity } from '../entities/student-group.entity';
import { Repository } from 'typeorm';
import { StudentGroupsMapper } from '../mappers/student-groups.mapper';
import { IStudentGroupListItemModel } from '../models/student-group-list-item.model';
import { ICreateStudentGroupModel } from '../models/create-student-group.model';
import { IEditStudentGroupModel } from '../models/edit-student-group.model';

@Injectable()
export class StudentGroupsService {
  constructor(
    @InjectRepository(StudentGroupEntity)
    private studentGroupsRepository: Repository<StudentGroupEntity>,
    private readonly studentGroupsMapper: StudentGroupsMapper,
  ) {}

  async getAll(params: IGetStudentGroupsFiltersModel): Promise<IGenericListPayloadResponse<IStudentGroupListItemModel>> {
    const { page, pageSize, search, } = params;
    const rolesQb = this.studentGroupsRepository
      .createQueryBuilder('groups')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      rolesQb.andWhere('groups.name LIKE :search', { search, });
    }

    const [groupsData, total] = await rolesQb.getManyAndCount();

    return {
      items: groupsData.map(
        (r) => this.studentGroupsMapper.entityToListItem(r)
      ),
      meta: { count: total, },
    };
  }

  async getById(id: string) {
    const group = await this.studentGroupsRepository.findOneOrFail({
      where: { id, }
    });
    return this.studentGroupsMapper.entityToItem(group);
  }

  async createGroup(data: ICreateStudentGroupModel) {
    const newGroup = this.studentGroupsRepository.create({
      name: data.name,
      studySpecification: data.studySpecification,
      studyYear: data.studyYear,
    },);
    const createdGroup = await this.studentGroupsRepository.save(newGroup);
    return this.studentGroupsMapper.entityToItem(createdGroup);
  }

  async editStudentGroup(groupData: IEditStudentGroupModel, studentGroupId: string) {
    const updatedGroup = await this.studentGroupsRepository.update(
      { id: studentGroupId, },
      {
        name: groupData.name,
        studySpecification: groupData.studySpecification,
        studyYear: groupData.studyYear,
      },
    );
    return !!updatedGroup.affected;
  }

  async deleteGroup(studentGroupId: string) {
    const studentGroupData = await this.studentGroupsRepository.findOneOrFail({
      where: { id: studentGroupId, }
    });
    const removedStudentGroup = await this.studentGroupsRepository.remove(studentGroupData);
    return this.studentGroupsMapper.entityToItem(removedStudentGroup);
  }
}
