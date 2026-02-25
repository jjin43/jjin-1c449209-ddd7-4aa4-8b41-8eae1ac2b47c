import { Controller, Get, Post, Body, Param, Put, Delete, Request, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Roles } from '@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/auth';
import { RolesGuard } from '@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/auth';

@UseGuards(RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Roles('VIEWER')
  @Get()
  async findAll(@Request() req: any) {
    return this.tasksService.findAll(req.user);
  }

  @Roles('VIEWER')
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.tasksService.findOne(id, req.user);
  }

  @Roles('VIEWER')
  @Post()
  async create(@Body() dto: CreateTaskDto, @Request() req: any) {
    return this.tasksService.create(dto, req.user);
  }

  @Roles('VIEWER')
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Request() req: any) {
    return this.tasksService.update(id, dto, req.user);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.tasksService.remove(id, req.user);
  }
}
