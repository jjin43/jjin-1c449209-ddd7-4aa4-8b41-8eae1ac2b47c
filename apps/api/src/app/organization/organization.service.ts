import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(@InjectRepository(Organization) private repo: Repository<Organization>) {}

  async findOne(id: string) {
    const org = await this.repo.findOneBy({ id } as any);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async create(data: Partial<Organization>) {
    if (data.parentId) {
      await this.validateParent(data.parentId);
    }
    const org = this.repo.create(data as any);
    return this.repo.save(org as any);
  }

  async update(id: string, data: Partial<Organization>) {
    const org = await this.repo.findOneBy({ id } as any);
    if (!org) throw new NotFoundException('Organization not found');
    if (data.parentId && data.parentId !== org.parentId) {
      await this.validateParent(data.parentId);
    }
    Object.assign(org, data);
    return this.repo.save(org as any);
  }

  private async validateParent(parentId: string) {
    const parent = await this.repo.findOneBy({ id: parentId } as any);
    if (!parent) throw new NotFoundException('Parent organization not found');
    if (parent.parentId) {
      throw new BadRequestException('Parent organization is already a child; grandchildren are not allowed');
    }
  }
}
