import { IsString, IsOptional, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/data';

class PermissionDto {
  @IsString()
  userId!: string;

  @IsOptional()
  canEdit?: boolean;

  @IsOptional()
  canDelete?: boolean;
}

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn([Role.OWNER, Role.ADMIN, Role.VIEWER])
  role?: Role;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions?: PermissionDto[];
}
