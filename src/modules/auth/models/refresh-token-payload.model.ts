import { TokenType } from "./token-type.enum";

export interface IRefreshTokenPayload {
  use: TokenType.Refresh;
  sid: string;
  gid: string;
};
