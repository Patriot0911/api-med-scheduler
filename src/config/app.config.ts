import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.APP_ENV || 'development',
  port: Number(process.env.APP_PORT) || 3000,
}));
