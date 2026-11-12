import { registerAs } from '@nestjs/config';
import { parseDurationSeconds } from './duration';

const readSecret = (name: string, devFallback: string): string => {
  const secret = process.env[name];
  if (secret) {
    return secret;
  }
  if (process.env.APP_ENV === 'production') {
    throw new Error(`${name} must be set in production`);
  }
  return devFallback;
};

export default registerAs('auth', () => ({
  jwt: {
    ttl: {
      access: parseDurationSeconds('JWT_ACCESS_TTL', 900),
      refresh: parseDurationSeconds('JWT_REFRESH_TTL', 604800),
    },
    secret: {
      access: readSecret('JWT_ACCESS_SECRET', 'jwt_access_secret_key'),
      refresh: readSecret('JWT_REFRESH_SECRET', 'jwt_refresh_secret_key'),
    },
  },
  passwordReset: {
    ttl: parseDurationSeconds('PASSWORD_RESET_TTL', 86400),
  },
}));
