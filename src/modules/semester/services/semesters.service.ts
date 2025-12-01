import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SemesterEntity } from '../entities/semester.entity';
import { IEditSemesterModel } from '../models/edit-semester.model';
import { ICreateSemesterModel } from '../models/create-semester.model';
import { IGetSemestersFiltersModel } from '../models/get-semesters-filters-model';
import { ISemesterListItemModel } from '../models/semester-list-item.model';
import { SemestersMapper } from '../mappers/semesters.mapper';
import { ISemesterItemModel } from '../models/semester-item.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';

@Injectable()
export class SemestersService {
  constructor(
    private readonly semestersMapper: SemestersMapper,
    @InjectRepository(SemesterEntity)
    private semestersRepository: Repository<SemesterEntity>,
  ) {}

  async getAll(params: IGetSemestersFiltersModel): Promise<IGenericListPayloadResponse<ISemesterListItemModel>> {
    const { page, pageSize, dateFrom, dateTo, } = params;
    const semQb = this.semestersRepository
      .createQueryBuilder('sem')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (dateFrom) {
      semQb.andWhere('sem.dateFrom >= :dateFrom', { dateFrom, });
    }
    if (dateTo) {
      semQb.andWhere('sem.dateTo <= :dateTo', { dateTo, });
    }

    const [semestersData, total] = await semQb.getManyAndCount();

    return {
      items: semestersData.map(
        (s) => this.semestersMapper.entityToListItem(s)
      ),
      meta: { count: total, },
    };
  }

  async getById(semesterId: string): Promise<ISemesterItemModel> {
    const semester = await this.semestersRepository.findOneOrFail({
      where: { id: semesterId, }
    });
    return this.semestersMapper.entityToItem(semester);
  }

  async createSemester(data: ICreateSemesterModel): Promise<ISemesterItemModel> {
    const newSemester = this.semestersRepository.create({
      description: data.description,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo
    },);
    const createdSemester = await this.semestersRepository.save(newSemester);
    return this.semestersMapper.entityToItem(createdSemester);
  }

  async editSemester(data: IEditSemesterModel, semesterId: string): Promise<boolean> {
    const updatedSemester = await this.semestersRepository.update(
      { id: semesterId, },
      {
        dateFrom: data.dateFrom,
        dateTo: data.dateTo,
        description: data.description,
      },
    );
    return !!updatedSemester.affected;
  }
}
