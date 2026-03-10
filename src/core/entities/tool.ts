export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolInvocation {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  toolInvocationId: string;
  success: boolean;
  data: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}
