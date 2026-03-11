import type { User } from "../entities/user";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  roles: User["roles"];
}

export interface UserRepository {
  create(user: { email: string; name: string; passwordHash: string }): Promise<User>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<User | null>;
}
