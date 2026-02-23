import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { Organization } from './entities/organization.entity';
import { User } from './entities/user.entity';
import { Task } from './entities/task.entity';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { OrganizationService } from './organization/organization.service';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/api/.env',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DB_TYPE', 'sqlite');
        if (dbType !== 'sqlite') {
          throw new Error(`DB_TYPE=${dbType} not supported. Use SQLite.`);
        }

        const dbPath = path.resolve(process.cwd(), 'apps', 'api', 'db.sqlite');
        console.log('[DB]', dbPath);

        return {
          type: 'sqlite' as const,
          database: config.get<string>('DB_PATH', 'apps/api/db.sqlite'),
          autoLoadEntities: true,
          synchronize: true, // dev only
          logging: ['error', 'schema', 'warn'],
        };
      },
    }),

      TypeOrmModule.forFeature([Organization, User, Task]),
      AuditModule,
    AuthModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService, OrganizationService],
})
export class AppModule {}
