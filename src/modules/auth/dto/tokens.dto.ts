import { ApiProperty } from "@nestjs/swagger";
import { ITokenModel } from "../models/token.model";

export class TokenDto implements ITokenModel {
  @ApiProperty({ type: 'string', })
  accessToken: string;

  @ApiProperty({ type: 'string', })
  refreshToken: string;
}
