import { IPaginationFilters } from "src/shared/models/pagination-filters.model";

export interface IGetRolesFiltersModel extends IPaginationFilters {
  search?: string;
};
