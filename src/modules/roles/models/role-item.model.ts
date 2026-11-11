import { Permission } from "src/shared/models/permission.enum";

export interface IRoleItemModel {
  id: string;
  name: string;
  rolePriority: number;
  permissions: Permission[];
  /** Whether the requesting user may edit / delete / grant this role */
  canManage: boolean;
};
