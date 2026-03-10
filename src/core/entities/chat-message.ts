export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  parts?: unknown[];
}

export interface ChatThread {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolCallInfo {
  name: string;
  args: Record<string, unknown>;
}

export function extractToolCalls(parts?: unknown[]): ToolCallInfo[] {
  if (!parts) return [];
  const calls: ToolCallInfo[] = [];
  for (const rawPart of parts) {
    const part = rawPart as { type?: string; name?: string; args?: Record<string, unknown> };
    if (part && typeof part === "object" && part.type === "tool_call" && part.name && part.args) {
      calls.push({ name: part.name, args: part.args });
    }
  }
  return calls;
}
