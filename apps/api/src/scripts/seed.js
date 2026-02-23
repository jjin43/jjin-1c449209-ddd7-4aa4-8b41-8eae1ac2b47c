const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

function openDb(dbPath) {
  return new sqlite3.Database(dbPath);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function main() {
  const dbPath = path.resolve(process.cwd(), 'apps', 'api', 'db.sqlite');
  console.log('[seed.js] using db:', dbPath);

  const db = openDb(dbPath);

  // create tables if missing (simple schema matching entities)
  await run(db, `CREATE TABLE IF NOT EXISTS organization (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    parentId TEXT,
    createdAt DATETIME DEFAULT (datetime('now'))
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    passwordHash TEXT,
    role TEXT,
    organizationId TEXT,
    createdAt DATETIME DEFAULT (datetime('now'))
  )`);

  // ensure default org
  let org = await get(db, 'SELECT id FROM organization WHERE name = ?', ['Default Org']);
  if (!org) {
    const id = cryptoId();
    await run(db, 'INSERT INTO organization (id, name) VALUES (?, ?)', [id, 'Default Org']);
    console.log('[seed.js] created org Default Org', id);
    org = { id };
  } else {
    console.log('[seed.js] found org', org.id);
  }

  const users = [
    { email: 'owner@example.com', password: 'password', role: 'OWNER' },
    { email: 'admin@example.com', password: 'password', role: 'ADMIN' },
    { email: 'viewer@example.com', password: 'password', role: 'VIEWER' },
  ];

  for (const u of users) {
    const exists = await get(db, 'SELECT id FROM user WHERE email = ?', [u.email]);
    const hash = await bcrypt.hash(u.password, 10);
    if (exists) {
      // update passwordHash/role/org in case seeding changed or hash missing
      await run(
        db,
        'UPDATE user SET passwordHash = ?, role = ?, organizationId = ? WHERE email = ?',
        [hash, u.role, org.id, u.email],
      );
      console.log('[seed.js] updated user', u.email, exists.id);
      continue;
    }
    const id = cryptoId();
    await run(db, 'INSERT INTO user (id, email, passwordHash, role, organizationId) VALUES (?, ?, ?, ?, ?)', [
      id,
      u.email,
      hash,
      u.role,
      org.id,
    ]);
    console.log('[seed.js] created user', u.email, id);
  }

  db.close();
  console.log('[seed.js] done');
}

function cryptoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  try {
    const { randomUUID } = require('crypto');
    return randomUUID();
  } catch (e) {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
