import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';
import { UserProfileType } from './user-profile-type.enum';

export interface IGetUsersFiltersModel extends IPaginationFilters {
  search?: string;
  /** Users with any of these roles */
  roleIds?: string[];
  /** Users with any of these profiles */
  profiles?: UserProfileType[];
};
