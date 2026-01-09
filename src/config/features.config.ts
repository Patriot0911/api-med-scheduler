import { registerAs } from '@nestjs/config';

export default registerAs('features', () => ({
  register: process.env.FEATURE_REGISTER === 'TRUE',
}));
