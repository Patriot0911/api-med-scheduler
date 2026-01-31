import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';

export interface IGetLessonsFiltersModel extends IPaginationFilters {
  dateTo?: string;
  dateFrom?: string;
  teacher?: string;
  group?: string;
}
