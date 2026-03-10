export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call"; name: string; args: Record<string, any> }
  | { type: "tool_result"; name: string; result: any }
  | { type: "error"; message: string }
  | { type: "done" };

export interface ChatStreamResponse {
  events(): AsyncIterableIterator<StreamEvent>;
  cancel(): void;
}
