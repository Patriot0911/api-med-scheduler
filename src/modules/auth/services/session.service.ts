import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { UserEntity } from "src/modules/users/entities/user.entity";
import { SessionEntity } from "../entities/session.entity";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { ITokenModel } from "../models/token.model";
import { IAccessTokenPayload } from "../models/access-token-payload.model";
import { TokenType } from "../models/token-type.enum";
import { IRefreshTokenPayload } from "../models/refresh-token-payload.model";
import dayjs from "dayjs";
import { UserService } from "src/modules/users/services/user.service";
import { TLogoutResponse } from "../models/logout.response";

@Injectable()
export class SessionService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectRepository(SessionEntity)
    private sessionRepository: Repository<SessionEntity>,
  ) {}

  async initSession(user: UserEntity): Promise<ITokenModel> {
    const sid = randomUUID();
    const gid = randomUUID();
    const sub = user.id;
    const newSession = this.sessionRepository.create({
      sid, gid, sub,
    });
    const savedSession = await this.sessionRepository.save(newSession);
    return await this.issueTokens(user, savedSession);
  }
  private async revokeSession(session: SessionEntity): Promise<void> {
    await this.sessionRepository.delete({
      sid: session.sid,
    });
  }
  private async rotateSession(session: SessionEntity): Promise<ITokenModel> {
    const gid = randomUUID();
    const user = await this.userService.getUserById(session.sub);
    if(!user) {
      throw new UnauthorizedException('User not found for session');
    }
    await this.sessionRepository.update(
      { sid: session.sid },
      { gid },
    );
    const rotated = { ...session, gid };
    return await this.issueTokens(user, rotated);
  }

  private async issueTokens(user: UserEntity, session: SessionEntity,): Promise<ITokenModel> {
    const roleNames = user.roles.map(r => r.name);
    const aggregatedPermissions = [
      ...new Set(
        user.roles.flatMap(role => role.permissions),
      ),
    ];

    const accessPayload: IAccessTokenPayload = {
      use: TokenType.Access,
      gid: session.gid,
      sub: session.sub,

      roles: roleNames,
      permissions: aggregatedPermissions,
    };
    const refreshPayload: IRefreshTokenPayload = {
      use: TokenType.Refresh,
      sid: session.sid,
      gid: session.gid,
    };
    const accessToken = await this.signTokenPayload(accessPayload, 'access');
    const refreshToken = await this.signTokenPayload(refreshPayload, 'refresh');
    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(payload: IRefreshTokenPayload): Promise<ITokenModel> {
    const session = await this.sessionRepository.findOneOrFail({
      where: {
        sid: payload.sid,
      },
    });
    const isFraud = session.gid !== payload.gid;
    if (isFraud) {
      await this.revokeSession(session);
      throw new UnauthorizedException('Refresh denied. Fraud attempt detected');
    }
    return await this.rotateSession(session);
  }

  async logout(payload: IAccessTokenPayload): Promise<boolean> {
    const session = await this.sessionRepository.findOneOrFail({
      where: {
        gid: payload.gid,
      },
    });
    await this.revokeSession(session);
    return true;
  }

  async verifyRefresh(payload: IRefreshTokenPayload): Promise<boolean> {
    if (payload.use !== TokenType.Refresh) return false;
    const session = await this.sessionRepository.findOne({
      where: {
        sid: payload.sid,
      },
    });
    if (!session) return false;
    const ttl = dayjs().diff(session.updatedAt, 'seconds');
    return ttl < this.configService.get('auth.jwt.refreshTtl');
  }
  async verifyAccess(payload: IAccessTokenPayload): Promise<boolean> {
    if (payload.use !== TokenType.Access) return false;
    const session = await this.sessionRepository.findOne({
      where: {
        gid: payload.gid,
      },
    });
    if (!session) return false;
    const ttl = dayjs().diff(session.updatedAt, 'seconds');
    return ttl < this.configService.get('auth.jwt.accessTtl');
  }

  async signTokenPayload(payload: any, type: 'refresh' | 'access'): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get(`auth.jwt.${type}Ttl`),
      secret: this.configService.get('auth.jwt.secret'),
    });
  }
}
