import type { MessagePart } from "./message-parts";

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
  createdAt: string;
}

export interface NewMessage {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
}
