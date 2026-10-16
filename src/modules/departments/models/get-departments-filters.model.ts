import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';

export interface IGetDepartmentsFiltersModel extends IPaginationFilters {
  search?: string;
};
