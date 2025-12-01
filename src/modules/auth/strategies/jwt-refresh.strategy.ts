import { Injectable, Scope } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IRefreshTokenPayload } from "../models/refresh-token-payload.model";
import { AuthService } from "../services/auth.service";
import { Request } from "express";
import { TokenType } from "../models/token-type.enum";

@Injectable({
  scope: Scope.DEFAULT,
})
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh',) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwt.secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: IRefreshTokenPayload): Promise<IRefreshTokenPayload & { refreshToken: string; }> {
    if (payload.use != TokenType.Refresh) throw new UnauthorizedException('Refresh denied');
    const token = req.get('authorization')?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Missing refresh token');
    const isValidRefreshToken = await this.authService.verifyRefreshToken(payload.sub, token);
    if (!isValidRefreshToken) throw new UnauthorizedException('Refresh denied');
    return { ...payload, refreshToken: token };
  }
}