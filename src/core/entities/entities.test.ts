import { describe, it, expect } from "vitest";
import type { ChatMessage } from "./chat-message";

describe("Core Entities", () => {
  it("should create a valid ChatMessage", () => {
    const message: ChatMessage = {
      id: "1",
      role: "user",
      content: "Hello",
      timestamp: new Date(),
    };
    expect(message.content).toBe("Hello");
  });
});
