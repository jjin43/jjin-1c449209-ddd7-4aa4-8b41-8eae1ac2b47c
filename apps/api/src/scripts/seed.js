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

  // ensure organizations: Default Org and Other Org
  const orgNames = ['Default Org', 'Other Org'];
  const orgMap = {};
  for (const name of orgNames) {
    let row = await get(db, 'SELECT id FROM organization WHERE name = ?', [name]);
    if (!row) {
      const id = cryptoId();
      await run(db, 'INSERT INTO organization (id, name) VALUES (?, ?)', [id, name]);
      console.log('[seed.js] created org', name, id);
      orgMap[name] = id;
    } else {
      console.log('[seed.js] found org', name, row.id);
      orgMap[name] = row.id;
    }
  }

  // users to ensure exist. viewer1 and viewer2 -> Default Org; viewer3 -> Other Org
  const users = [
    { email: 'owner@example.com', password: 'password', role: 'OWNER', org: 'Default Org' },
    { email: 'admin@example.com', password: 'password', role: 'ADMIN', org: 'Default Org' },
    { email: 'viewer1@example.com', password: 'password', role: 'VIEWER', org: 'Default Org' },
    { email: 'viewer2@example.com', password: 'password', role: 'VIEWER', org: 'Default Org' },
    { email: 'viewer3@example.com', password: 'password', role: 'VIEWER', org: 'Other Org' },
  ];

  for (const u of users) {
    const exists = await get(db, 'SELECT id FROM user WHERE email = ?', [u.email]);
    const hash = await bcrypt.hash(u.password, 10);
    const orgId = orgMap[u.org] || orgMap['Default Org'];
    if (exists) {
      // update passwordHash/role/org in case seeding changed or hash missing
      await run(
        db,
        'UPDATE user SET passwordHash = ?, role = ?, organizationId = ? WHERE email = ?',
        [hash, u.role, orgId, u.email],
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
      orgId,
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
