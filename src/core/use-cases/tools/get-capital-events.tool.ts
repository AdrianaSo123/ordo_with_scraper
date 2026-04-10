import type { ToolDescriptor } from "@/core/tool-registry/ToolDescriptor";
import {
  CAPITAL_EVENT_TYPES,
  executeGetCapitalEvents,
} from "@mcp/capital-intelligence-tool";
import { getAnthropicApiKey, getOpenaiApiKeyOptional } from "@/lib/config/env";
import {
  GetCapitalEventsCommand,
  type GetCapitalEventsInput,
  type GetCapitalEventsOutput,
} from "./CapitalIntelligenceTool";
import type { GetCapitalEventsArgs } from "@mcp/capital-intelligence-tool";

/**
 * Factory for the get_capital_events tool descriptor.
 *
 * Wires the concrete MCP executor and injects environment variables
 * from the host environment into the Docker transport.
 */
export function createGetCapitalEventsTool(): ToolDescriptor<
  GetCapitalEventsInput,
  GetCapitalEventsOutput
> {
  // ---------------------------------------------------------------------------
  // Inject keys from host environment into the MCP container.
  // OPENAI_API_KEY is omitted entirely when absent — passing an empty string
  // is semantically different from not setting the variable.
  // ---------------------------------------------------------------------------
  const dockerExecutor = (args: GetCapitalEventsArgs) => {
    // N-5: read keys at execution time so a missing key only fails this specific
    // tool call — not the entire registry build at server startup.
    const env: Record<string, string> = {
      ANTHROPIC_API_KEY: getAnthropicApiKey(),
    };
    const openaiKey = getOpenaiApiKeyOptional();
    if (openaiKey) {
      env.OPENAI_API_KEY = openaiKey;
    }
    return executeGetCapitalEvents(args, { env });
  };

  return {
    name: "get_capital_events",
    schema: {
      description:
        "Retrieve recent capital investment intelligence from the internal tracking system: funding rounds, acquisitions, partnerships, contracts, and restructuring events. Use this tool — not web search — when asked about the current state of capital investments, recent funding activity, or deal flow. CRITICAL: Report ONLY the exact events returned by this tool. Never add, infer, or supplement with events from training knowledge. If the tool returns 3 events, show exactly 3 events. Admin only.",
      input_schema: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Number of events to return (1–100, default 10).",
          },
          event_type: {
            type: "string",
            enum: [...CAPITAL_EVENT_TYPES],
            description: "Optional filter by event type.",
          },
        },
        required: [],
      },
    },
    command: new GetCapitalEventsCommand(dockerExecutor),
    roles: ["ADMIN"],
    category: "system",
  };
}
