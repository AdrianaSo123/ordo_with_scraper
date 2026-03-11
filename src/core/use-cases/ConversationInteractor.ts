import type { ConversationRepository } from "./ConversationRepository";
import type { MessageRepository } from "./MessageRepository";
import type { Conversation, ConversationSummary, Message, NewMessage } from "../entities/conversation";

const MAX_MESSAGES_PER_CONVERSATION = 100;
const MAX_CONVERSATIONS_PER_USER = 50;
const AUTO_TITLE_MAX_LENGTH = 80;

export class ConversationInteractor {
  constructor(
    private readonly conversationRepo: ConversationRepository,
    private readonly messageRepo: MessageRepository,
  ) {}

  async create(userId: string, title: string = ""): Promise<Conversation> {
    const conversations = await this.conversationRepo.listByUser(userId);
    if (conversations.length >= MAX_CONVERSATIONS_PER_USER) {
      // Delete oldest conversation to make room
      const oldest = conversations[conversations.length - 1];
      await this.conversationRepo.delete(oldest.id);
    }

    const id = `conv_${crypto.randomUUID()}`;
    return this.conversationRepo.create({ id, userId, title });
  }

  async get(conversationId: string, userId: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundError("Conversation not found");
    }
    const messages = await this.messageRepo.listByConversation(conversationId);
    return { conversation, messages };
  }

  async list(userId: string): Promise<ConversationSummary[]> {
    return this.conversationRepo.listByUser(userId);
  }

  async delete(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundError("Conversation not found");
    }
    await this.conversationRepo.delete(conversationId);
  }

  async appendMessage(msg: NewMessage, userId: string): Promise<Message> {
    const conversation = await this.conversationRepo.findById(msg.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundError("Conversation not found");
    }

    const count = await this.messageRepo.countByConversation(msg.conversationId);
    if (count >= MAX_MESSAGES_PER_CONVERSATION) {
      throw new MessageLimitError("Conversation has reached the 100-message limit");
    }

    const message = await this.messageRepo.create(msg);

    // Auto-title from first user message
    if (msg.role === "user" && !conversation.title) {
      const title = msg.content.slice(0, AUTO_TITLE_MAX_LENGTH);
      await this.conversationRepo.updateTitle(msg.conversationId, title);
    }

    await this.conversationRepo.touch(msg.conversationId);

    return message;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class MessageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessageLimitError";
  }
}
