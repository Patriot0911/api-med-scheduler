import { Permission } from 'src/shared/models/permission.enum';

export interface IAuthorityModel {
  userId: string;
  permissions: Permission[];
  rank: number;
  isAdmin: boolean;
};
