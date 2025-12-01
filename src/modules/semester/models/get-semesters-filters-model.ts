import { IPaginationFilters } from "src/shared/models/pagination-filters.model";

export interface IGetSemestersFiltersModel extends IPaginationFilters {
  dateTo?: Date;
  dateFrom?: Date;
  search?: string;
};
