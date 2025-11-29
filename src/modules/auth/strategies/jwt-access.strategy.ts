import { Injectable, Scope } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IAccessTokenPayload } from "../models/access-token-payload.model";
import { SessionService } from "../services/session.service";

@Injectable({
  scope: Scope.DEFAULT,
})
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access',) {
  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwt.secret'),
    });
  }

  async validate(payload: IAccessTokenPayload): Promise<IAccessTokenPayload> {
    const isValid = await this.sessionService.verifyAccess(payload);
    if (!isValid)
      throw new UnauthorizedException(
        'Access denied. Invalid authorization token',
      );
    return payload;
  }
}