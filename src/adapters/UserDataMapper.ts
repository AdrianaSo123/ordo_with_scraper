import type Database from "better-sqlite3";
import type { User, RoleName } from "../core/entities/user";

export class UserDataMapper {
  constructor(private db: Database.Database) {}

  public findByActiveRole(activeRoleName: RoleName): User | null {
    const mockUserRow = this.db
      .prepare(
        `
            SELECT u.id, u.email, u.name 
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = ?
        `,
      )
      .get(activeRoleName) as
      | { id: string; email: string; name: string }
      | undefined;

    if (!mockUserRow) return null;

    const rolesRows = this.db
      .prepare(
        `
            SELECT r.name 
            FROM roles r
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = ?
        `,
      )
      .all(mockUserRow.id) as { name: RoleName }[];

    const roles = rolesRows.map((r) => r.name);

    return {
      id: mockUserRow.id,
      email: mockUserRow.email,
      name: mockUserRow.name,
      roles,
    };
  }
}
