import { IGenericDataResponse } from "src/shared/models/generic-data.response";
import { IUserPayload } from "./user-payload.model";

export type TGetMeResponse = IGenericDataResponse<IUserPayload>;
