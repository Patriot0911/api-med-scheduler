import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { DepartmentEntity } from '../entities/department.entity';
import { DepartmentsMapper } from '../mappers/departments.mapper';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { IDepartmentDictionaryItem } from '../models/department-dictionary-item.model';
import { IGetDepartmentsFiltersModel } from '../models/get-departments-filters.model';
import { IDepartmentListItemModel } from '../models/department-list-item.model';
import { IDepartmentItemModel } from '../models/department-item.model';
import { ICreateDepartmentModel } from '../models/create-department.model';
import { IEditDepartmentModel } from '../models/edit-department.model';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly departmentsMapper: DepartmentsMapper,
    @InjectRepository(DepartmentEntity)
    private departmentsRepository: Repository<DepartmentEntity>,
  ) {}

  async getDepartmentsDictionary(): Promise<IDepartmentDictionaryItem[]> {
    const departments = await this.departmentsRepository.find({
      select: ['id', 'name',],
      order: { name: 'ASC', },
    });
    return departments.map(
      (d) => this.departmentsMapper.entityToDictionaryItem(d)
    );
  }

  async getAll(params: IGetDepartmentsFiltersModel): Promise<IGenericListPayloadResponse<IDepartmentListItemModel>> {
    const { page, pageSize, search, } = params;
    const depQb = this.departmentsRepository
      .createQueryBuilder('dep')
      .orderBy('dep.name', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      depQb.andWhere('dep.name ILIKE :search', { search: `%${search}%`, });
    }

    const [departmentsData, total] = await depQb.getManyAndCount();

    return {
      items: departmentsData.map(
        (d) => this.departmentsMapper.entityToListItem(d)
      ),
      meta: { count: total, },
    };
  }

  async getById(departmentId: string): Promise<IDepartmentItemModel> {
    const department = await this.departmentsRepository.findOneOrFail({
      where: { id: departmentId, },
    });
    return this.departmentsMapper.entityToItem(department);
  }

  async createDepartment(data: ICreateDepartmentModel): Promise<IDepartmentItemModel> {
    await this.checkNameIsFree(data.name);
    const newDepartment = this.departmentsRepository.create({
      name: data.name,
    });
    const createdDepartment = await this.departmentsRepository.save(newDepartment);
    return this.departmentsMapper.entityToItem(createdDepartment);
  }

  async editDepartment(data: IEditDepartmentModel, departmentId: string): Promise<boolean> {
    await this.checkNameIsFree(data.name, departmentId);
    const updatedDepartment = await this.departmentsRepository.update(
      { id: departmentId, },
      { name: data.name, },
    );
    return !!updatedDepartment.affected;
  }

  async deleteDepartment(departmentId: string): Promise<IDepartmentItemModel> {
    const departmentData = await this.departmentsRepository.findOneOrFail({
      where: { id: departmentId, }
    });
    // Teachers of this department are detached automatically (FK is ON DELETE SET NULL).
    const removedDepartment = await this.departmentsRepository.remove(departmentData);
    return this.departmentsMapper.entityToItem({ ...removedDepartment, id: departmentId, });
  }

  private async checkNameIsFree(name: string, excludeId?: string): Promise<void> {
    const existing = await this.departmentsRepository.findOne({
      where: excludeId ? { name, id: Not(excludeId), } : { name, },
    });
    if (existing) {
      throw new BadRequestException('Department with this name already exists');
    }
  }
}
