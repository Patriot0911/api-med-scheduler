import { IGenericDataResponse } from "src/shared/models/generic-data.response";
import { ITokenModel } from "./token.model";
import { IUserPayload } from "./user-payload.model";

export interface IRegisterResponsePayload {
  user: IUserPayload;
  token: ITokenModel;
};

export type TRegisterResponse = IGenericDataResponse<IRegisterResponsePayload>;
