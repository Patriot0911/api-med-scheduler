import { Injectable, Scope } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SessionService } from "../services/session.service";
import { IRefreshTokenPayload } from "../models/refresh-token-payload.model";

@Injectable({
  scope: Scope.DEFAULT,
})
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh',) {
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

  async validate(payload: IRefreshTokenPayload): Promise<IRefreshTokenPayload> {
    const isValid = await this.sessionService.verifyRefresh(payload);
    if (!isValid)
      throw new UnauthorizedException(
        'Refresh denied. Invalid authorization token',
      );
    return payload;
  }
}