import { describe, it, expect } from "vitest";
import type { ChatMessage } from "./chat-message";
import type { ToolInvocation, ToolResult } from "./tool";

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

  it("should create a valid ToolInvocation", () => {
    const invocation: ToolInvocation = {
      id: "call_1",
      toolName: "calculator",
      args: { a: 1, b: 2 },
    };
    expect(invocation.toolName).toBe("calculator");
  });

  it("should create a valid ToolResult", () => {
    const result: ToolResult = {
      toolInvocationId: "call_1",
      success: true,
      data: 3,
    };
    expect(result.data).toBe(3);
  });
});
