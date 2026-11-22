import { TokenType } from './token-type.enum';

export interface IRefreshTokenPayload {
  use: TokenType.Refresh,
  sub: string;
};
export interface IRefreshTokenPayloadWithToken extends IRefreshTokenPayload {
  refreshToken: string;
};
