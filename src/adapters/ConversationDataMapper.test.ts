import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { ensureSchema } from "../lib/db/schema";
import { ConversationDataMapper } from "./ConversationDataMapper";
import { MessageDataMapper } from "./MessageDataMapper";

function createDb() {
  const db = new Database(":memory:");
  // Enable foreign keys (needed for CASCADE)
  db.pragma("foreign_keys = ON");
  ensureSchema(db);
  return db;
}

function seedUser(db: Database.Database) {
  db.prepare(
    `INSERT OR IGNORE INTO users (id, email, name) VALUES ('usr_test', 'test@test.com', 'Test')`,
  ).run();
  db.prepare(
    `INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES ('usr_test', 'role_authenticated')`,
  ).run();
}

describe("ConversationDataMapper", () => {
  let db: Database.Database;
  let mapper: ConversationDataMapper;

  beforeEach(() => {
    db = createDb();
    seedUser(db);
    mapper = new ConversationDataMapper(db);
  });

  it("create → findById lifecycle", async () => {
    const conv = await mapper.create({ id: "conv_1", userId: "usr_test", title: "Hello" });
    expect(conv.id).toBe("conv_1");
    expect(conv.userId).toBe("usr_test");
    expect(conv.title).toBe("Hello");

    const found = await mapper.findById("conv_1");
    expect(found).not.toBeNull();
    expect(found!.title).toBe("Hello");
  });

  it("listByUser returns summaries with messageCount ordered by updated_at desc", async () => {
    await mapper.create({ id: "conv_a", userId: "usr_test", title: "First" });
    await mapper.create({ id: "conv_b", userId: "usr_test", title: "Second" });

    // Add messages to conv_a
    const msgMapper = new MessageDataMapper(db);
    await msgMapper.create({ conversationId: "conv_a", role: "user", content: "hi", parts: [] });
    await msgMapper.create({ conversationId: "conv_a", role: "assistant", content: "hello", parts: [] });

    // Manually set updated_at so ordering is deterministic (datetime('now') may be same second)
    db.prepare(`UPDATE conversations SET updated_at = '2099-01-01 00:00:00' WHERE id = 'conv_a'`).run();

    const list = await mapper.listByUser("usr_test");
    expect(list.length).toBe(2);
    // conv_a has later updated_at → should be first
    expect(list[0].id).toBe("conv_a");
    expect(list[0].messageCount).toBe(2);
    expect(list[1].id).toBe("conv_b");
    expect(list[1].messageCount).toBe(0);
  });

  it("delete removes conversation", async () => {
    await mapper.create({ id: "conv_del", userId: "usr_test", title: "Delete me" });
    await mapper.delete("conv_del");
    const found = await mapper.findById("conv_del");
    expect(found).toBeNull();
  });

  it("delete cascades to messages", async () => {
    await mapper.create({ id: "conv_cas", userId: "usr_test", title: "Cascade" });
    const msgMapper = new MessageDataMapper(db);
    await msgMapper.create({ conversationId: "conv_cas", role: "user", content: "test", parts: [] });
    expect(await msgMapper.countByConversation("conv_cas")).toBe(1);

    await mapper.delete("conv_cas");
    expect(await msgMapper.countByConversation("conv_cas")).toBe(0);
  });

  it("updateTitle changes title", async () => {
    await mapper.create({ id: "conv_t", userId: "usr_test", title: "" });
    await mapper.updateTitle("conv_t", "New Title");
    const found = await mapper.findById("conv_t");
    expect(found!.title).toBe("New Title");
  });

  it("findById returns null for nonexistent", async () => {
    const found = await mapper.findById("nonexistent");
    expect(found).toBeNull();
  });
});

describe("MessageDataMapper", () => {
  let db: Database.Database;
  let mapper: MessageDataMapper;

  beforeEach(() => {
    db = createDb();
    seedUser(db);
    // Create a conversation for messages
    const convMapper = new ConversationDataMapper(db);
    convMapper.create({ id: "conv_msg", userId: "usr_test", title: "Test" });
    mapper = new MessageDataMapper(db);
  });

  it("create → listByConversation lifecycle", async () => {
    const msg = await mapper.create({
      conversationId: "conv_msg",
      role: "user",
      content: "Hello world",
      parts: [{ type: "text", text: "Hello world" }],
    });
    expect(msg.id).toMatch(/^msg_/);
    expect(msg.content).toBe("Hello world");
    expect(msg.parts).toEqual([{ type: "text", text: "Hello world" }]);

    const list = await mapper.listByConversation("conv_msg");
    expect(list.length).toBe(1);
    expect(list[0].content).toBe("Hello world");
  });

  it("parts JSON round-trip with tool_call and tool_result", async () => {
    const parts = [
      { type: "text" as const, text: "Let me search" },
      { type: "tool_call" as const, name: "search_books", args: { query: "design" } },
      { type: "tool_result" as const, name: "search_books", result: [{ title: "Design Book" }] },
      { type: "text" as const, text: "I found it" },
    ];

    await mapper.create({
      conversationId: "conv_msg",
      role: "assistant",
      content: "Let me search I found it",
      parts,
    });

    const list = await mapper.listByConversation("conv_msg");
    expect(list[0].parts).toEqual(parts);
  });

  it("listByConversation is ordered by created_at ASC", async () => {
    await mapper.create({ conversationId: "conv_msg", role: "user", content: "first", parts: [] });
    await mapper.create({ conversationId: "conv_msg", role: "assistant", content: "second", parts: [] });
    await mapper.create({ conversationId: "conv_msg", role: "user", content: "third", parts: [] });

    const list = await mapper.listByConversation("conv_msg");
    expect(list.map((m) => m.content)).toEqual(["first", "second", "third"]);
  });

  it("countByConversation returns correct count", async () => {
    expect(await mapper.countByConversation("conv_msg")).toBe(0);
    await mapper.create({ conversationId: "conv_msg", role: "user", content: "a", parts: [] });
    await mapper.create({ conversationId: "conv_msg", role: "assistant", content: "b", parts: [] });
    expect(await mapper.countByConversation("conv_msg")).toBe(2);
  });
});
