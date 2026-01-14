import { IPaginationFilters } from "src/shared/models/pagination-filters.model";

export interface IGetStudentGroupsFiltersModel extends IPaginationFilters {
  search?: string;
  tags?: string[];
};
