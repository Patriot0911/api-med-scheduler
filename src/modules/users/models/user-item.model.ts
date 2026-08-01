export interface IUserItemModel {
  id: string;
  email: string;
  fullName: string;
  roleIds: string[];
  createdAt: Date;
  lastLoginAt: Date | null;
};
