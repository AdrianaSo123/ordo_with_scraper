import type { Conversation, ConversationSummary } from "../entities/conversation";

export interface ConversationRepository {
  create(conv: { id: string; userId: string; title: string }): Promise<Conversation>;
  listByUser(userId: string): Promise<ConversationSummary[]>;
  findById(id: string): Promise<Conversation | null>;
  delete(id: string): Promise<void>;
  updateTitle(id: string, title: string): Promise<void>;
  touch(id: string): Promise<void>;
}
