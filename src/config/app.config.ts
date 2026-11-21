import { registerAs } from '@nestjs/config';

const readCorsOrigins = (): string[] | true => {
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length) {
    return origins;
  }
  if (process.env.APP_ENV === 'production') {
    throw new Error('CORS_ORIGINS must be set in production');
  }
  return true;
};

export default registerAs('app', () => ({
  env: process.env.APP_ENV || 'development',
  port: Number(process.env.APP_PORT) || 3000,
  corsOrigins: readCorsOrigins(),
}));
