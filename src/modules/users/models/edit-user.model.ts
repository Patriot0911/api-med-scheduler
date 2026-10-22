export interface IEditUserModel {
  email: string;
  fullName: string;
  /** Missing keeps the current roles */
  roleIds?: string[];
};
