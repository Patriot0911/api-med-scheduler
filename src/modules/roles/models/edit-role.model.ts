import { Permission } from "../../../shared/models/permission.enum";

export interface IEditRoleModel {
  name: string;
  permissions: Permission[];
  rolePriority?: number;
};
