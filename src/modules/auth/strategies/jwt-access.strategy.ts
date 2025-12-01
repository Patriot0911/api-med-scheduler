import { Injectable, Scope, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { IAccessTokenPayload } from "../models/access-token-payload.model";
import { TokenType } from "../models/token-type.enum";

@Injectable({
  scope: Scope.DEFAULT,
})
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access',) {
  constructor(
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.jwt.secret'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: IAccessTokenPayload): Promise<IAccessTokenPayload> {
    if (payload.use != TokenType.Access) throw new UnauthorizedException('Access denied');
    return payload;
  }
}