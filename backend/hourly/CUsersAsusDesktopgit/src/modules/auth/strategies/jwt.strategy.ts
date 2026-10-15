import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CurrentUserPayload } from '../../../common/interfaces/current-user.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwtSecret', 'hourly-jwt-development-secret-key-2026'),
    });
  }

  async validate(payload: any): Promise<CurrentUserPayload> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Malformed token payload');
    }
    return {
      userId: payload.sub,
      phone: payload.phone,
      role: payload.role,
      name: payload.name,
    };
  }
}
