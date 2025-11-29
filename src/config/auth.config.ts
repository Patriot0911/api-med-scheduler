import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    accessTtl: Number(process.env.JWT_ACCESS_TTL) || 900,
    refreshTtl: Number(process.env.JWT_REFRESH_TTL) || 604800,
    secret: process.env.JWT_SECRET || 'jwt_secret_key',
  },
}));
