import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: ['dist/**/*.entity.js'],
  migrations: [
    'dist/database/migrations/*.js',
  ],
});
