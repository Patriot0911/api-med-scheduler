import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';
import { ILessonsFiltersModel } from './lessons-filters.model';

/** Without page / pageSize the whole list is returned, ordered by date (calendars). */
export interface IGetLessonsFiltersModel extends Partial<IPaginationFilters>, ILessonsFiltersModel {
}
