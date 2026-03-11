export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; result: unknown }
  | { type: "conversation_id"; id: string }
  | { type: "error"; message: string }
  | { type: "done" };
