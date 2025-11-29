import { IGenericDataResponse } from "src/shared/models/generic-data.response";
import { ITokenModel } from "./token.model";
import { IUserPayload } from "./user-payload.model";

export interface ILoginResponsePayload {
  user: IUserPayload;
  token: ITokenModel;
};

export type TLoginResponse = IGenericDataResponse<ILoginResponsePayload>;
