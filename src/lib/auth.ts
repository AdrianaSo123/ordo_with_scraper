import { cookies } from "next/headers";
import { getDb } from "./db";
import { UserDataMapper } from "../adapters/UserDataMapper";
import type { RoleName, User as SessionUser } from "../core/entities/user";

export type { RoleName, SessionUser };

const MOCK_SESSION_COOKIE_NAME = "lms_mock_session_role";

/**
 * Mocks setting an authentication session by writing a cookie containing the active role.
 * In a real application, this would be handled by NextAuth and signed JWTs.
 */
export async function setMockSession(role: RoleName) {
  const cookieStore = await cookies();
  cookieStore.set(MOCK_SESSION_COOKIE_NAME, role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Identifies the current mock user by reading the active cookie role,
 * looking up the mock user bound to that role in SQLite, and computing their roles array.
 */
export async function getSessionUser(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const rawRole = cookieStore.get(MOCK_SESSION_COOKIE_NAME)?.value as
    | RoleName
    | undefined;

  // Default to ANONYMOUS if no explicit cookie is set
  const activeRoleName = rawRole || "ANONYMOUS";

  const db = getDb();
  const mapper = new UserDataMapper(db);

  const user = mapper.findByActiveRole(activeRoleName);

  if (!user) {
    return {
      id: "usr_anonymous",
      email: "anonymous@example.com",
      name: "Anonymous User",
      roles: ["ANONYMOUS"],
    };
  }

  return user;
}

/**
 * Helper to block access if the user lacks the required RBAC role.
 */
export async function requireRole(allowedRoles: RoleName[]) {
  const user = await getSessionUser();
  const hasAccess = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    throw new Error(
      `Unauthorized. Requires one of: ${allowedRoles.join(", ")}`,
    );
  }
}
