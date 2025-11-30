import { Permission } from "../../../shared/models/permission.enum";

export interface ICreateRoleModel {
  name: string;
  permissions: Permission[];
  rolePriority: number | undefined;
};
