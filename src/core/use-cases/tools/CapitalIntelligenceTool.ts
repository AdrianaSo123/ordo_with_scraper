import type { ToolCommand } from "@/core/tool-registry/ToolCommand";
import type { ToolExecutionContext } from "@/core/tool-registry/ToolExecutionContext";
import {
  CAPITAL_EVENT_TYPES,
  type CapitalEvent,
  type CapitalEventType,
  type GetCapitalEventsArgs,
} from "@mcp/capital-intelligence-tool";

// ---------------------------------------------------------------------------
// Input / Output types
// ---------------------------------------------------------------------------

export interface GetCapitalEventsInput {
  limit?: number;
  event_type?: string;
}

export interface GetCapitalEventsOutput {
  results: CapitalEvent[];
  error?: string; // Support graceful error reporting to LLM (Stress Test #2)
}

// ---------------------------------------------------------------------------
// Executor port — Dependency Inversion Principle
// ---------------------------------------------------------------------------

export type CapitalEventsExecutor = (
  args: GetCapitalEventsArgs,
) => Promise<GetCapitalEventsOutput>;

// ---------------------------------------------------------------------------
// Validation — pure guard functions
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function validateLimit(raw: number | undefined): number {
  const limit = raw ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
    throw new Error(
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
    throw new Error(
      `event_type must be one of: ${CAPITAL_EVENT_TYPES.join(", ")}.`,
    );
  }
  return raw;
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
    _context?: ToolExecutionContext, // Reserved for future audit logging
  ): Promise<GetCapitalEventsOutput> {
    try {
      const limit = validateLimit(input.limit);
      const eventType = validateEventType(input.event_type);

      const args: GetCapitalEventsArgs = {
        limit,
        ...(eventType ? { event_type: eventType } : {}),
      };

      return await this.executor(args);
    } catch (err) {
      // ---------------------------------------------------------------------
      // Hardening: Graceful degradation (Stress Test #2)
      // ---------------------------------------------------------------------
      const message = err instanceof Error ? err.message : String(err);
      
      // If it's a validation error, let it bubble up (it's a user/agent error)
      if (message.includes("limit must be") || message.includes("event_type must be")) {
        throw err;
      }

      // If it's an infrastructure/MCP error, return a graceful message to the LLM.
      // Distinguish transient vs. permanent failures so the LLM can give correct advice.
      const isPermanent =
        message.includes("API_KEY") ||
        message.includes("not found") ||
        message.includes("No such image");
      const advice = isPermanent
        ? "Please contact the administrator to check the service configuration."
        : "Please try again later.";
      return {
        results: [],
        error: `The capital intelligence service is currently unavailable: ${message}. ${advice}`,
      };
    }
  }
}
