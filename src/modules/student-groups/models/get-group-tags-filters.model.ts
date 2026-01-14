import { IPaginationFilters } from "src/shared/models/pagination-filters.model";

export interface IGetTagsFiltersModel extends IPaginationFilters {
  search?: string;
};
