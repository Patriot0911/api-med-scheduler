import { Permission } from "src/shared/models/permission.enum";
import { TokenType } from "./token-type.enum";

export interface IAccessTokenPayload {
  use: TokenType.Access,
  sub: string;
  permissions: Permission[];
  roles: string[];
};
