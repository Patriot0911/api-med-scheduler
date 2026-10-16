import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';
import { ILessonsFiltersModel } from './lessons-filters.model';

export interface IGetLessonsFiltersModel extends IPaginationFilters, ILessonsFiltersModel {
}
