import { resolve } from "node:path";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

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
  title: string;
  company: string | null;
  event_type: CapitalEventType;
  funding_amount: string | null;
  summary: string;
  published_at: string;
}

export interface GetCapitalEventsArgs {
  limit: number;
  event_type?: CapitalEventType;
}

export interface McpClientOptions {
  dockerImage?: string;
  dataMount?: DataMount;
  timeoutMs?: number;
  env?: Record<string, string>;
}

// ── Error Classes ──────────────────────────────────────────────────
// R4-1: declared before any helper that references it — eliminates TDZ risk.

export class McpInvocationError extends Error {
  /** True when the failure is configuration/contract-level and will not resolve by retrying. */
  readonly isPermanent: boolean;

  constructor(message: string, options: { permanent?: boolean; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = "McpInvocationError";
    this.isPermanent = options.permanent ?? false;
  }
}

const DEFAULT_TIMEOUT_MS = 30000;

// R4-1: helpers now appear after McpInvocationError.
// TD-1: pinnable via CAPITAL_MCP_IMAGE without a code deploy.
function getDockerImage(): string {
  const image = process.env.CAPITAL_MCP_IMAGE ?? "ai-capital-mcp:latest";
  if (!image) {
    throw new McpInvocationError(
      "CAPITAL_MCP_IMAGE is set to an empty string — provide a valid image reference",
      { permanent: true },
    );
  }
  return image;
}

// R4-3: support either a named Docker volume (CAPITAL_DOCKER_VOLUME) or a
// host bind-mount path (CAPITAL_DATA_PATH). Volume takes precedence so
// deployments that share the scraper_data volume need zero local files.
type DataMount =
  | { type: "volume"; name: string }
  | { type: "path"; path: string };

function getDataMount(): DataMount {
  const volume = process.env.CAPITAL_DOCKER_VOLUME;
  if (volume) return { type: "volume", name: volume };
  const raw = process.env.CAPITAL_DATA_PATH ?? resolve("./data");
  const path = raw.replace(/^["']|["']$/g, "");
  return { type: "path", path };
}

// ── Deadline helper ─────────────────────────────────────────────────

function withDeadline<T>(promise: Promise<T>, deadline: number, timeoutMs: number): Promise<T> {
  const remaining = Math.max(0, deadline - Date.now());
  let handle: ReturnType<typeof setTimeout> | undefined;
  const timer = new Promise<never>((_, reject) => {
    handle = setTimeout(
      () => reject(new McpInvocationError(`MCP invocation timed out after ${timeoutMs}ms`)),
      remaining,
    );
  });
  return Promise.race([promise, timer]).finally(() => {
    if (handle !== undefined) clearTimeout(handle);
  });
}

// R4-5: cap client.close() so a hung container never blocks shutdown.
function closeWithDeadline(client: Client, ms: number): Promise<void> {
  let handle: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    client.close().catch(() => {}),
    new Promise<void>(res => { handle = setTimeout(res, ms); }),
  ]).finally(() => { if (handle !== undefined) clearTimeout(handle); });
}

// ── Env file helpers (keeps credentials out of ps aux) ───────────────

function writeEnvFile(env: Record<string, string>): string {
  // T-1: validate both keys and values.
  // A key with '=' splits into a wrong name; a key or value with '\n' injects extra lines.
  for (const [k, v] of Object.entries(env)) {
    if (/[\r\n]/.test(k) || k.includes("=")) {
      throw new McpInvocationError(
        `Environment variable key "${k}" contains an invalid character ('=' or newline)`,
        { permanent: true },
      );
    }
    if (/[\r\n]/.test(v)) {
      throw new McpInvocationError(
        `Environment variable "${k}" contains a newline which would corrupt the env file`,
        { permanent: true },
      );
    }
  }
  const content = Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const filePath = `${tmpdir()}/ordo-mcp-${randomUUID()}.env`;
  writeFileSync(filePath, content, { mode: 0o600 });
  return filePath;
}

function removeEnvFile(filePath: string): void {
  try {
    unlinkSync(filePath);
  } catch {
    // Non-fatal: the file may already be gone
  }
}

// ── Docker args builder ─────────────────────────────────────────────

// R4-2: envFilePath is null when no credentials are passed — omit --env-file.
function buildDockerArgs(image: string, mount: DataMount, envFilePath: string | null): string[] {
  const args = ["run", "-i", "--rm"];
  if (envFilePath !== null) {
    args.push("--env-file", envFilePath);
  }
  if (mount.type === "volume") {
    args.push("--mount", `source=${mount.name},target=/app/data`);
  } else {
    args.push("-v", `${mount.path}:/app/data`);
  }
  args.push(image);
  return args;
}

// ── Response parser and validator ──────────────────────────────────

function isCapitalEvent(value: unknown): value is CapitalEvent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    (typeof v.company === "string" || v.company === null) &&
    typeof v.event_type === "string" &&
    (CAPITAL_EVENT_TYPES as readonly string[]).includes(v.event_type) &&
    (typeof v.funding_amount === "string" || v.funding_amount === null) &&
    typeof v.summary === "string" &&
    typeof v.published_at === "string"
  );
}

function parseToolResponse(result: unknown): CapitalEvent[] {
  const toolResult = result as CallToolResult;
  if (!toolResult.content || toolResult.content.length === 0) {
    throw new McpInvocationError("Empty response from MCP tool");
  }

  const textContent = toolResult.content[0] as { type: string; text?: string };
  if (textContent.type !== "text" || !textContent.text) {
    throw new McpInvocationError("MCP tool returned non-text content");
  }

  let mcpResponse: { success: boolean; data?: unknown[]; error?: string };
  try {
    mcpResponse = JSON.parse(textContent.text);
  } catch {
    // R4-4: truncate and sanitise raw container output before embedding in the message
    // to prevent newlines/ANSI codes or large blobs from contaminating structured logs.
    const preview = textContent.text.length > 200
      ? `${textContent.text.slice(0, 200)}…`
      : textContent.text;
    throw new McpInvocationError(
      `Malformed JSON in tool output: ${preview.replace(/[\r\n]/g, " ")}`,
    );
  }

  // N-3: treat a missing `success` field the same as success: false.
  if (mcpResponse.success !== true) {
    const errorMsg = mcpResponse.error || "MCP tool reported a non-success response";
    // API key / auth errors inside the container are permanent — retrying won't help.
    const isPermanent = /api.?key|invalid.?api|auth|unauthorized/i.test(errorMsg);
    throw new McpInvocationError(errorMsg, { permanent: isPermanent });
  }

  if (!Array.isArray(mcpResponse.data)) {
    throw new McpInvocationError("Invalid MCP tool output: expected 'data' array");
  }

  const validEvents = mcpResponse.data.filter(isCapitalEvent);
  if (validEvents.length !== mcpResponse.data.length) {
    throw new McpInvocationError(
      `MCP tool returned ${mcpResponse.data.length - validEvents.length} malformed event(s)`,
    );
  }

  return validEvents;
}

// ── Core Transport ─────────────────────────────────────────────────

export async function executeGetCapitalEvents(
  args: GetCapitalEventsArgs,
  options?: McpClientOptions,
): Promise<{ results: CapitalEvent[] }> {
  const image = options?.dockerImage ?? getDockerImage();
  const mount = options?.dataMount ?? getDataMount();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const env = options?.env ?? {};

  const deadline = Date.now() + timeoutMs;

  // N-1: declared outside try so finally can clean up regardless of where
  // setup fails (e.g. if StdioClientTransport constructor throws).
  let envFilePath: string | null = null;
  let client: Client | null = null;

  try {
    // R4-2: skip the env file entirely when no credentials are provided.
    envFilePath = Object.keys(env).length > 0 ? writeEnvFile(env) : null;

    // T-3: use "pipe" so container stderr is captured and forwarded
    // selectively, rather than mixed raw into the host process output.
    const transport = new StdioClientTransport({
      command: "docker",
      args: buildDockerArgs(image, mount, envFilePath),
      stderr: "pipe",
    });

    client = new Client(
      { name: "studio-ordo-client", version: "1.0.0" },
      { capabilities: {} },
    );

    await withDeadline(client.connect(transport), deadline, timeoutMs);

    const result = await withDeadline(
      client.callTool({
        name: "get_capital_events",
        arguments: args as unknown as Record<string, unknown>,
      }),
      deadline,
      timeoutMs,
    );

    return { results: parseToolResponse(result) };

  } catch (err: unknown) {
    if (err instanceof McpInvocationError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    // Docker-level errors (image not found, pull denied) are permanent.
    const isPermanent =
      /No such image|Unable to find image|pull access denied|image not found/i.test(message);
    // T-4: pass original error as cause so the full stack is preserved.
    throw new McpInvocationError(`MCP protocol error: ${message}`, { permanent: isPermanent, cause: err });
  } finally {
    if (envFilePath !== null) removeEnvFile(envFilePath);
    if (client !== null) {
      await closeWithDeadline(client, 2000);
    }
  }
}
