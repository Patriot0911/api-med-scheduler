import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    ttl: {
      access: Number(process.env.JWT_ACCESS_TTL) || 900,
      refresh: Number(process.env.JWT_REFRESH_TTL) || 604800,
    },
    secret: {
      access: process.env.JWT_ACCESS_SECRET || 'jwt_access_secret_key',
      refresh: process.env.JWT_REFRESH_SECRET || 'jwt_refresh_secret_key',
    },
  },
  passwordReset: {
    ttl: Number(process.env.PASSWORD_RESET_TTL) || 86400,
  },
}));
