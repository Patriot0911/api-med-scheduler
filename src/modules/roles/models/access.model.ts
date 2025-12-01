import { Permission } from "src/shared/models/permission.enum";

export interface IAccessModel {
  roles: string[];
  permissions: Permission[];
};
