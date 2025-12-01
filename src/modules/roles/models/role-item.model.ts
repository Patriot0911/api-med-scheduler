import { Permission } from "src/shared/models/permission.enum";

export interface IRoleItemModel {
  id: string;
  name: string;
  rolePriority: number;
  permissions: Permission[];
};
