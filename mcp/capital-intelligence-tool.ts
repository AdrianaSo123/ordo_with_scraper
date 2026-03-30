import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

export const CAPITAL_EVENT_TYPES = [
  "funding",
  "acquisition",
  "partnership",
  "contract",
  "restructuring",
  "other",
] as const;

export type CapitalEventType = (typeof CAPITAL_EVENT_TYPES)[number];

export interface CapitalEvent {
  id: string;
  event_type: CapitalEventType;
  company: string;
  amount?: number;
  date: string;
  description: string;
  source_url: string;
}

export interface GetCapitalEventsArgs {
  limit: number;
  event_type?: CapitalEventType;
}

export interface McpClientOptions {
  dockerImage?: string;
  dataPath?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
}

const DEFAULTS = {
  dockerImage: "ai-capital-mcp:latest",
  dataPath: resolve("./data"),
  timeoutMs: 30000,
};

// ── Custom Error Class ──────────────────────────────────────────────

export class McpInvocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpInvocationError";
  }
}

// ── Core Transport — Professional Grade (SDK-based) ─────────────────

/**
 * Invokes the 'get_capital_events' tool on the external MCP server via Docker stdio.
 * Uses the official Model Context Protocol SDK for protocol compliance.
 */
export async function executeGetCapitalEvents(
  args: GetCapitalEventsArgs,
  options?: McpClientOptions,
): Promise<{ results: CapitalEvent[] }> {
  const image = options?.dockerImage ?? DEFAULTS.dockerImage;
  const dataPath = options?.dataPath ?? DEFAULTS.dataPath;
  const timeoutMs = options?.timeoutMs ?? DEFAULTS.timeoutMs;
  const env = options?.env ?? {};

  // 1. Prepare Docker environment flags
  const envFlags = Object.entries(env).flatMap(([k, v]) => ["-e", `${k}=${v}`]);

  // 2. Initialize the official SDK Transport
  const transport = new StdioClientTransport({
    command: "docker",
    args: [
      "run",
      "-i",
      "--rm",
      ...envFlags,
      "-v",
      `${dataPath}:/app/data`,
      image,
    ],
    stderr: "inherit", // Pass server errors to the host logs for observability
  });

  // 3. Initialize the official SDK Client
  const client = new Client(
    { name: "studio-ordo-client", version: "1.0.0" },
    { capabilities: {} },
  );

  try {
    // 4. Connect and perform handshake (initialize/initialized)
    await client.connect(transport);

    // 5. Invoke the tool with a timeout guard
    // Note: The SDK handles JSON-RPC wrapping and response validation
    const result = await Promise.race([
      client.callTool({
        name: "get_capital_events",
        arguments: args as any,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new McpInvocationError(`MCP invocation timed out after ${timeoutMs}ms`)),
          timeoutMs,
        )
      ),
    ]);

    // 6. Post-process the SDK response
    // Model Context Protocol returns a CallToolResult with a 'content' array.
    const toolResult = result as any;
    if (!toolResult.content || toolResult.content.length === 0) {
      throw new McpInvocationError("Empty response from MCP tool");
    }

    const firstContent = toolResult.content[0];
    if (firstContent.type !== "text" || !firstContent.text) {
      throw new McpInvocationError("MCP tool returned non-text content");
    }

    // The capital intelligence server returns a JSON-stringified object { success, data, error }
    let toolOutput: any;
    try {
      toolOutput = JSON.parse(firstContent.text);
    } catch {
      throw new McpInvocationError(`Malformed JSON in tool output: ${firstContent.text}`);
    }

    if (toolOutput.success === false) {
      throw new McpInvocationError(toolOutput.error || "Unknown MCP error");
    }

    if (!Array.isArray(toolOutput.data)) {
      throw new McpInvocationError("Invalid MCP tool output: expected 'data' array");
    }

    return { results: toolOutput.data };

  } catch (err: any) {
    // 7. Cleanup and Wrap
    if (err instanceof McpInvocationError) throw err;
    throw new McpInvocationError(`MCP protocol error: ${err.message || String(err)}`);
  } finally {
    // 8. Close the connection cleanly
    try {
      await client.close();
    } catch {
      // Ignore close errors
    }
  }
}
