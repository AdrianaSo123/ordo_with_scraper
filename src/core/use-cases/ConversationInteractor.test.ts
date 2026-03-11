import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConversationInteractor, NotFoundError, MessageLimitError } from "./ConversationInteractor";
import type { ConversationRepository } from "./ConversationRepository";
import type { MessageRepository } from "./MessageRepository";
import type { Conversation, ConversationSummary, Message, NewMessage } from "../entities/conversation";

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conv_1",
    userId: "usr_1",
    title: "",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg_1",
    conversationId: "conv_1",
    role: "user",
    content: "Hello",
    parts: [{ type: "text", text: "Hello" }],
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createMockRepos() {
  const convRepo: ConversationRepository = {
    create: vi.fn().mockResolvedValue(makeConversation()),
    listByUser: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
    updateTitle: vi.fn().mockResolvedValue(undefined),
    touch: vi.fn().mockResolvedValue(undefined),
  };
  const msgRepo: MessageRepository = {
    create: vi.fn().mockResolvedValue(makeMessage()),
    listByConversation: vi.fn().mockResolvedValue([]),
    countByConversation: vi.fn().mockResolvedValue(0),
  };
  return { convRepo, msgRepo };
}

describe("ConversationInteractor", () => {
  let interactor: ConversationInteractor;
  let convRepo: ConversationRepository;
  let msgRepo: MessageRepository;

  beforeEach(() => {
    const mocks = createMockRepos();
    convRepo = mocks.convRepo;
    msgRepo = mocks.msgRepo;
    interactor = new ConversationInteractor(convRepo, msgRepo);
  });

  describe("create", () => {
    it("creates a new conversation with generated id", async () => {
      const conv = await interactor.create("usr_1", "My Chat");
      expect(convRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "usr_1", title: "My Chat" }),
      );
      expect((convRepo.create as ReturnType<typeof vi.fn>).mock.calls[0][0].id).toMatch(/^conv_/);
    });

    it("auto-deletes oldest when at 50 conversations", async () => {
      const summaries: ConversationSummary[] = Array.from({ length: 50 }, (_, i) => ({
        id: `conv_${i}`,
        title: `Chat ${i}`,
        updatedAt: `2024-01-${String(i + 1).padStart(2, "0")}`,
        messageCount: 1,
      }));
      (convRepo.listByUser as ReturnType<typeof vi.fn>).mockResolvedValue(summaries);

      await interactor.create("usr_1");
      // Should delete the last in the list (oldest by updated_at desc order)
      expect(convRepo.delete).toHaveBeenCalledWith("conv_49");
    });
  });

  describe("get — ownership enforcement (NEG-SEC-6)", () => {
    it("returns conversation + messages for owner", async () => {
      (convRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConversation({ id: "conv_1", userId: "usr_1" }),
      );
      (msgRepo.listByConversation as ReturnType<typeof vi.fn>).mockResolvedValue([makeMessage()]);

      const result = await interactor.get("conv_1", "usr_1");
      expect(result.conversation.id).toBe("conv_1");
      expect(result.messages.length).toBe(1);
    });

    it("throws NotFoundError for wrong user (not 403)", async () => {
      (convRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConversation({ id: "conv_1", userId: "usr_1" }),
      );

      await expect(interactor.get("conv_1", "usr_other")).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError for nonexistent conversation", async () => {
      (convRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(interactor.get("conv_999", "usr_1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete — ownership enforcement", () => {
    it("deletes owned conversation", async () => {
      (convRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConversation({ id: "conv_1", userId: "usr_1" }),
      );

      await interactor.delete("conv_1", "usr_1");
      expect(convRepo.delete).toHaveBeenCalledWith("conv_1");
    });

    it("throws NotFoundError for wrong user", async () => {
      (convRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConversation({ id: "conv_1", userId: "usr_1" }),
      );

      await expect(interactor.delete("conv_1", "usr_other")).rejects.toThrow(NotFoundError);
    });
  });

  describe("appendMessage", () => {
    beforeEach(() => {
      (convRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConversation({ id: "conv_1", userId: "usr_1", title: "" }),
      );
    });

    it("appends message and calls touch", async () => {
      const newMsg: NewMessage = {
        conversationId: "conv_1",
        role: "user",
        content: "Hello",
        parts: [],
      };

      await interactor.appendMessage(newMsg, "usr_1");
      expect(msgRepo.create).toHaveBeenCalledWith(newMsg);
      expect(convRepo.touch).toHaveBeenCalledWith("conv_1");
    });

    it("auto-titles from first user message when title is empty", async () => {
      const newMsg: NewMessage = {
        conversationId: "conv_1",
        role: "user",
        content: "What is the meaning of life?",
        parts: [],
      };

      await interactor.appendMessage(newMsg, "usr_1");
      expect(convRepo.updateTitle).toHaveBeenCalledWith("conv_1", "What is the meaning of life?");
    });

    it("truncates auto-title to 80 chars", async () => {
      const longContent = "A".repeat(120);
      const newMsg: NewMessage = {
        conversationId: "conv_1",
        role: "user",
        content: longContent,
        parts: [],
      };

      await interactor.appendMessage(newMsg, "usr_1");
      expect(convRepo.updateTitle).toHaveBeenCalledWith("conv_1", "A".repeat(80));
    });

    it("does NOT auto-title for assistant messages", async () => {
      const newMsg: NewMessage = {
        conversationId: "conv_1",
        role: "assistant",
        content: "I'm an AI",
        parts: [],
      };

      await interactor.appendMessage(newMsg, "usr_1");
      expect(convRepo.updateTitle).not.toHaveBeenCalled();
    });

    it("does NOT auto-title when title already set", async () => {
      (convRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConversation({ id: "conv_1", userId: "usr_1", title: "Existing" }),
      );

      const newMsg: NewMessage = {
        conversationId: "conv_1",
        role: "user",
        content: "Hello",
        parts: [],
      };

      await interactor.appendMessage(newMsg, "usr_1");
      expect(convRepo.updateTitle).not.toHaveBeenCalled();
    });

    it("throws MessageLimitError at 100 messages (TEST-CHAT-09)", async () => {
      (msgRepo.countByConversation as ReturnType<typeof vi.fn>).mockResolvedValue(100);

      const newMsg: NewMessage = {
        conversationId: "conv_1",
        role: "user",
        content: "Over limit",
        parts: [],
      };

      await expect(interactor.appendMessage(newMsg, "usr_1")).rejects.toThrow(MessageLimitError);
      expect(msgRepo.create).not.toHaveBeenCalled();
    });

    it("throws NotFoundError for wrong user on appendMessage", async () => {
      const newMsg: NewMessage = {
        conversationId: "conv_1",
        role: "user",
        content: "Hello",
        parts: [],
      };

      await expect(interactor.appendMessage(newMsg, "usr_other")).rejects.toThrow(NotFoundError);
    });
  });

  describe("list", () => {
    it("delegates to convRepo.listByUser", async () => {
      const summaries: ConversationSummary[] = [
        { id: "conv_1", title: "Chat 1", updatedAt: "2024-01-01", messageCount: 5 },
      ];
      (convRepo.listByUser as ReturnType<typeof vi.fn>).mockResolvedValue(summaries);

      const result = await interactor.list("usr_1");
      expect(result).toEqual(summaries);
      expect(convRepo.listByUser).toHaveBeenCalledWith("usr_1");
    });
  });
});
