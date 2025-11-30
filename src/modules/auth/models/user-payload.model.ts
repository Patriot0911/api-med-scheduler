import { Permission } from "src/shared/models/permission.enum";

export interface IUserPayload {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: Permission[];
};
