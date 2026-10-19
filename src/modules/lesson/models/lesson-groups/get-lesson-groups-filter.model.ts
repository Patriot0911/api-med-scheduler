import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';

export interface IGetLessonGroupsFiltersModel extends IPaginationFilters {
  search?: string;
  departmentId?: string;
};
