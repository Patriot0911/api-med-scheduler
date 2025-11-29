import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { UserEntity } from "src/modules/users/entities/user.entity";
import { SessionEntity } from "../entities/session.entity";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class SessionService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(SessionEntity)
    private sessionRepository: Repository<SessionEntity>,
  ) {}

  async initSession(user: UserEntity): Promise<any> {
    const sid = randomUUID();
    const gid = randomUUID();
    const sub = user.id;
    const newSession = this.sessionRepository.create({
      sid, gid, sub,
    });
    const savedSession = await this.sessionRepository.save(newSession);
    return await this.issueTokens(user, savedSession);
  }

  private async issueTokens(user: UserEntity, session: SessionEntity,): Promise<any> {
    const accessPayload: any = {
      use: 'access',
      gid: session.gid,
      sub: session.sub,
      // roles: user.roles,
    };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: this.configService.get('auth.jwt.accessTtl'),
    });
    const refreshPayload: any = {
      use: 'refresh',
      sid: session.sid,
      gid: session.gid,
    };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: this.configService.get('auth.jwt.refreshTtl'),
    });
    return {
      data: {
        token: accessToken,
        refreshToken,
      },
    };
  }
}
