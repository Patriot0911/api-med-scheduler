import { ApiProperty } from "@nestjs/swagger";
import { IAuthResponse } from "../models/auth-response.model";
import type { IUserPayload } from "../models/user-payload.model";
import type { ITokenModel } from "../models/token.model";
import { UserPayloadDto } from "./user-payload.dto";
import { TokenDto } from "./tokens.dto";

export class AuthResponseDto implements IAuthResponse {
  @ApiProperty({ type: TokenDto, })
  tokens: ITokenModel;

  @ApiProperty({ type: UserPayloadDto, })
  user: IUserPayload;
}
