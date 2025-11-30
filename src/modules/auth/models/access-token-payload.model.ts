import { Permission } from "src/shared/models/permission.enum";
import { TokenType } from "./token-type.enum";

export interface IAccessTokenPayload {
  use: TokenType.Access;
  gid: string;
  sub: string;
  roles: string[];
  permissions: Permission[];
};
