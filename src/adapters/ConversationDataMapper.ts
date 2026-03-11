import type Database from "better-sqlite3";
import type { Conversation, ConversationSummary } from "@/core/entities/conversation";
import type { ConversationRepository } from "@/core/use-cases/ConversationRepository";

export class ConversationDataMapper implements ConversationRepository {
  constructor(private db: Database.Database) {}

  async create(conv: { id: string; userId: string; title: string }): Promise<Conversation> {
    this.db
      .prepare(
        `INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)`,
      )
      .run(conv.id, conv.userId, conv.title);

    const row = this.db
      .prepare(`SELECT id, user_id, title, created_at, updated_at FROM conversations WHERE id = ?`)
      .get(conv.id) as ConversationRow;

    return mapRow(row);
  }

  async listByUser(userId: string): Promise<ConversationSummary[]> {
    const rows = this.db
      .prepare(
        `SELECT c.id, c.title, c.updated_at, COUNT(m.id) AS message_count
         FROM conversations c
         LEFT JOIN messages m ON m.conversation_id = c.id
         WHERE c.user_id = ?
         GROUP BY c.id
         ORDER BY c.updated_at DESC`,
      )
      .all(userId) as Array<{
      id: string;
      title: string;
      updated_at: string;
      message_count: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: r.updated_at,
      messageCount: r.message_count,
    }));
  }

  async findById(id: string): Promise<Conversation | null> {
    const row = this.db
      .prepare(`SELECT id, user_id, title, created_at, updated_at FROM conversations WHERE id = ?`)
      .get(id) as ConversationRow | undefined;

    return row ? mapRow(row) : null;
  }

  async delete(id: string): Promise<void> {
    this.db.prepare(`DELETE FROM conversations WHERE id = ?`).run(id);
  }

  async updateTitle(id: string, title: string): Promise<void> {
    this.db
      .prepare(`UPDATE conversations SET title = ? WHERE id = ?`)
      .run(title, id);
  }

  async touch(id: string): Promise<void> {
    this.db
      .prepare(`UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`)
      .run(id);
  }
}

type ConversationRow = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
