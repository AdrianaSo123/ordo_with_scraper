import type { ToolCommand } from "@/core/tool-registry/ToolCommand";
import type { ToolExecutionContext } from "@/core/tool-registry/ToolExecutionContext";
import {
  CAPITAL_EVENT_TYPES,
  McpInvocationError,
  type CapitalEvent,
  type CapitalEventType,
  type GetCapitalEventsArgs,
} from "@mcp/capital-intelligence-tool";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class CapitalIntelligenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CapitalIntelligenceValidationError";
  }
}

// ---------------------------------------------------------------------------
// Input / Output types
// ---------------------------------------------------------------------------

export interface GetCapitalEventsInput {
  limit?: number;
  // R4-7: narrowed from `string` to `CapitalEventType` so the type accurately
  // reflects valid values; callers testing invalid input use a type cast.
  event_type?: CapitalEventType;
}

export type GetCapitalEventsOutput =
  | { ok: true; results: CapitalEvent[]; _total: number; _grounding: string }
  | { ok: false; error: string; _grounding: string };

// ---------------------------------------------------------------------------
// Executor port — Dependency Inversion Principle
// ---------------------------------------------------------------------------

export type CapitalEventsExecutor = (
  args: GetCapitalEventsArgs,
) => Promise<{ results: CapitalEvent[] }>;

// ---------------------------------------------------------------------------
// Validation — pure guard functions
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function validateLimit(raw: number | undefined): number {
  const limit = raw ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
    throw new CapitalIntelligenceValidationError(
      `limit must be an integer between ${MIN_LIMIT} and ${MAX_LIMIT}.`,
    );
  }
  return limit;
}

function isCapitalEventType(value: string): value is CapitalEventType {
  return (CAPITAL_EVENT_TYPES as readonly string[]).includes(value);
}

function validateEventType(raw: string | undefined): CapitalEventType | undefined {
  if (raw === undefined) return undefined;
  if (!isCapitalEventType(raw)) {
    throw new CapitalIntelligenceValidationError(
      `event_type must be one of: ${CAPITAL_EVENT_TYPES.join(", ")}.`,
    );
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Audit helper — structured key=value pairs, forwards to process stderr so it
// stays separate from application stdout and can be captured by log aggregators.
// ---------------------------------------------------------------------------

function auditLog(fields: Record<string, string | number | undefined>): void {
  const line = Object.entries(fields)
    .map(([k, v]) => `${k}=${v ?? "none"}`)
    .join(" ");
  process.stderr.write(`[audit:capital_events] ${line}\n`);
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export class GetCapitalEventsCommand
  implements ToolCommand<GetCapitalEventsInput, GetCapitalEventsOutput>
{
  constructor(private readonly executor: CapitalEventsExecutor) {}

  async execute(
    input: GetCapitalEventsInput,
    context?: ToolExecutionContext,
  ): Promise<GetCapitalEventsOutput> {
    // T-7/T-8: always emit a structured audit record; missing context is an
    // explicit signal rather than a silent no-op for this ADMIN-only tool.
    auditLog({
      userId: context?.userId ?? "no-context",
      conversationId: context?.conversationId,
      limit: input.limit ?? DEFAULT_LIMIT,
      // R4-7: "(none)" replaces the magic "all" string; conveys absence explicitly.
      event_type: input.event_type ?? "(none)",
    });

    // T-5: validate before entering the infrastructure try/catch so a bug in
    // validation (unexpected TypeError, etc.) surfaces as a real error rather
    // than being silently swallowed as "service unavailable".
    const limit = validateLimit(input.limit);
    const eventType = validateEventType(input.event_type);

    const args: GetCapitalEventsArgs = {
      limit,
      ...(eventType ? { event_type: eventType } : {}),
    };

    try {
      const { results } = await this.executor(args);
      return {
        ok: true,
        results,
        _total: results.length,
        _grounding: `Exactly ${results.length} events found. Show ONLY these events. Do NOT add any others.`,
      };
    } catch (err) {
      // Infrastructure/MCP errors degrade gracefully.
      // OCP: isPermanent is classified by the transport layer (McpInvocationError.isPermanent).
      // T-6: the string fallback `message.includes("API_KEY")` is removed — any error the
      // transport raises is already a McpInvocationError with isPermanent set correctly.
      const message = err instanceof Error ? err.message : String(err);
      const isPermanent = err instanceof McpInvocationError && err.isPermanent;
      const advice = isPermanent
        ? "Please contact the administrator to check the service configuration."
        : "Please try again later.";
      // R4-8: one level of framing — the McpInvocationError message is already
      // descriptive; triple-stacking was producing noise in LLM responses.
      return {
        ok: false,
        error: `Capital intelligence unavailable: ${message}. ${advice}`,
        _grounding: "DO NOT fabricate events. Report this error to the user exactly as-is. Do not supplement with training knowledge.",
      };
    }
  }
}
