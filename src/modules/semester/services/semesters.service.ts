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
import { ISemesterDictionaryItem } from '../models/semester-dictionary-item.model';

@Injectable()
export class SemestersService {
  constructor(
    private readonly semestersMapper: SemestersMapper,
    @InjectRepository(SemesterEntity)
    private semestersRepository: Repository<SemesterEntity>,
  ) {}

  async getSemesterDictionary(): Promise<ISemesterDictionaryItem[]> {
    const semesters = await this.semestersRepository.find({
      select: ['id', 'name',]
    });
    return semesters.map(
      (s) => this.semestersMapper.entityToDictionaryItem(s)
    );
  }

  async getAll(params: IGetSemestersFiltersModel): Promise<IGenericListPayloadResponse<ISemesterListItemModel>> {
    const { page, pageSize, dateFrom, dateTo, search, } = params;
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
    if (search) {
      semQb.andWhere('sem.name ILIKE :search', { search: `%${search}%`, });
    }

    const [semestersData, total] = await semQb
      .distinct(true)
      .getManyAndCount();

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
      name: data.name,
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
        name: data.name,
      },
    );
    return !!updatedSemester.affected;
  }

  async deleteSemester(semesterId: string): Promise<ISemesterItemModel> {
    const semesetrData = await this.semestersRepository.findOneOrFail({
      where: { id: semesterId, }
    });
    const removedSemester = await this.semestersRepository.remove(semesetrData);
    return this.semestersMapper.entityToItem(removedSemester);
  }
}
