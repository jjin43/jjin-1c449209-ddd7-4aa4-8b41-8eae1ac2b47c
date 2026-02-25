import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Permission } from '../entities/permission.entity';
import { User } from '../entities/user.entity';
import { UsersModule } from '../users/users.module';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Permission]), UsersModule, AuditModule],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
