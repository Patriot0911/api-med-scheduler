import { IGenericDataResponse } from "src/shared/models/generic-data.response";
import { ITokenModel } from "./token.model";

export interface IRegisterResponsePayload {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  token: ITokenModel;
}

export type TRegisterResponse = IGenericDataResponse<IRegisterResponsePayload>;
