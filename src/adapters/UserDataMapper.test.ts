import { describe, it, expect } from "vitest";
import { UserDataMapper } from "./UserDataMapper";
import Database from "better-sqlite3";
import { ensureSchema } from "../lib/db/schema";

describe("UserDataMapper", () => {
  it("should retrieve a user by active role", () => {
    const db = new Database(":memory:");
    ensureSchema(db);

    const mapper = new UserDataMapper(db);
    const user = mapper.findByActiveRole("ADMIN");

    expect(user).toBeDefined();
    expect(user?.email).toBe("admin@example.com");
    expect(user?.roles).toContain("ADMIN");

    db.close();
  });

  it("should return null for unknown role", () => {
    const db = new Database(":memory:");
    ensureSchema(db);

    const mapper = new UserDataMapper(db);
    const user = mapper.findByActiveRole("UNKNOWN" as "ADMIN");

    expect(user).toBeNull();

    db.close();
  });
});
