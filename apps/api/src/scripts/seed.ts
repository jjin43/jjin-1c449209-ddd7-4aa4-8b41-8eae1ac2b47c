import { DataSource } from 'typeorm';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { Organization } from '../app/entities/organization.entity';
import { User } from '../app/entities/user.entity';
import { Task } from '../app/entities/task.entity';

async function main() {
  const dbPath = path.resolve(process.cwd(), 'apps', 'api', 'db.sqlite');
  console.log('[seed] using db:', dbPath);

  const ds = new DataSource({
    type: 'sqlite',
    database: dbPath,
    entities: [Organization, User, Task],
    synchronize: true,
    logging: false,
  });

  await ds.initialize();

  const orgRepo = ds.getRepository(Organization);
  const userRepo = ds.getRepository(User);

  let org = await orgRepo.findOneBy({ name: 'Default Org' });
  if (!org) {
    org = orgRepo.create({ name: 'Default Org' });
    org = await orgRepo.save(org);
    console.log('[seed] created org', org.id);
  } else {
    console.log('[seed] found org', org.id);
  }

  const users = [
    { email: 'owner@example.com', password: 'password_owner', role: 'OWNER' },
    { email: 'admin@example.com', password: 'password_admin', role: 'ADMIN' },
    { email: 'viewer@example.com', password: 'password_viewer', role: 'VIEWER' },
  ];

  for (const u of users) {
    const existing = await userRepo.findOneBy({ email: u.email });
    if (existing) {
      console.log('[seed] user exists', u.email);
      continue;
    }
    const hash = await bcrypt.hash(u.password, 10);
    const user = userRepo.create({
      email: u.email,
      passwordHash: hash,
      role: u.role as any,
      organization: org as any,
      organizationId: (org as any).id,
    } as any);
    const saved = await userRepo.save(user as any);
    console.log('[seed] created user', saved.email, saved.id);
  }

  await ds.destroy();
  console.log('[seed] done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
