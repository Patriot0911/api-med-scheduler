import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfig, authConfig, dbConfig } from './config';
import { StudentGroupsModule } from './modules/student-groups/student-groups.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { DictionariesModule } from './modules/dictionaries/dictionaries.module';
import { SemesterModule } from './modules/semester/semester.module';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    UsersModule,
    SemesterModule,
    DictionariesModule,
    StudentGroupsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, authConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.database'),

        autoLoadEntities: true,
        synchronize: config.get('app.env') !== 'production',

        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
      }),
    }),
  ],
  providers: [],
})
export class AppModule {}
