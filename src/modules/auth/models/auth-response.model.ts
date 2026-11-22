import { ITokenModel } from './token.model';
import { IUserPayload } from './user-payload.model';

export interface IAuthResponse {
  tokens: ITokenModel;
  user: IUserPayload;
};
