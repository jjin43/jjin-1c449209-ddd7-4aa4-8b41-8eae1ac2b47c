import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { RolesGuard } from '@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/auth';

describe('TasksController', () => {
  let controller: TasksController;
  const mockService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 't1' }),
    update: jest.fn().mockResolvedValue({ id: 't1', title: 'updated' }),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: mockService },
        { provide: RolesGuard, useValue: { canActivate: () => true } },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('calls findAll and returns list', async () => {
    const res = await controller.findAll({ user: { organizationId: 'o1', role: 'VIEWER' } } as any);
    expect(mockService.findAll).toHaveBeenCalledWith('o1', 'VIEWER');
    expect(res).toEqual([]);
  });

  it('create forwards dto and user', async () => {
    const dto = { title: 't' } as any;
    const res = await controller.create(dto, { user: { userId: 'u1', organizationId: 'o1' } } as any);
    expect(mockService.create).toHaveBeenCalledWith(dto, { userId: 'u1', organizationId: 'o1' });
    expect(res).toEqual({ id: 't1' });
  });
});
