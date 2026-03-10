import type Database from "better-sqlite3";

export function ensureSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );
  `);

  // Seed roles
  const seedRoles = db.prepare(`
    INSERT OR IGNORE INTO roles (id, name, description)
    VALUES 
      ('role_anonymous', 'ANONYMOUS', 'No access'),
      ('role_authenticated', 'AUTHENTICATED', 'Logged in user with basic privileges'),
      ('role_staff', 'STAFF', 'Internal team member'),
      ('role_admin', 'ADMIN', 'Full system access')
  `);
  seedRoles.run();

  // Seed mock users
  const seedUsers = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, name)
    VALUES 
      ('usr_anonymous', 'anonymous@example.com', 'Anonymous User'),
      ('usr_authenticated', 'authenticated@example.com', 'Standard User'),
      ('usr_staff', 'staff@example.com', 'Staff Member'),
      ('usr_admin', 'admin@example.com', 'System Admin')
  `);
  seedUsers.run();

  // Bind users to roles
  const seedUserRoles = db.prepare(`
    INSERT OR IGNORE INTO user_roles (user_id, role_id)
    VALUES
      ('usr_anonymous', 'role_anonymous'),
      ('usr_authenticated', 'role_authenticated'),
      ('usr_staff', 'role_staff'),
      ('usr_admin', 'role_admin')
  `);
  seedUserRoles.run();
}
