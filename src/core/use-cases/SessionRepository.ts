import type { Session } from "../entities/session";

export interface SessionRepository {
  create(session: Session): Promise<void>;
  findByToken(id: string): Promise<Session | null>;
  delete(id: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
