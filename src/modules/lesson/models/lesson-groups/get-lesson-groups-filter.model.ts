import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';

export interface IGetLessonGroupsFiltersModel extends IPaginationFilters {
  dateTo?: Date;
  dateFrom?: Date;
  teacher?: string;
  group?: string;
}
