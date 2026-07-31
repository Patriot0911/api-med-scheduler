import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';

export interface IGetUsersFiltersModel extends IPaginationFilters {
  search?: string;
};
