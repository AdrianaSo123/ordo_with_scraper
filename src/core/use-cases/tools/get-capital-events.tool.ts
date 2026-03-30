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
  // Inject keys from host environment into the MCP container
  // ---------------------------------------------------------------------------
  const wrappedExecutor = (args: GetCapitalEventsArgs) =>
    executeGetCapitalEvents(args, {
      env: {
        ANTHROPIC_API_KEY: getAnthropicApiKey(),
        // OPENAI_API_KEY is optional: the MCP server can use it but does not require it.
        OPENAI_API_KEY: getOpenaiApiKeyOptional() ?? "",
      },
    });

  return {
    name: "get_capital_events",
    schema: {
      description:
        "Retrieve recent capital intelligence events (funding rounds, acquisitions, partnerships, contracts, restructuring). Returns structured event data. Admin only.",
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
    command: new GetCapitalEventsCommand(wrappedExecutor),
    roles: ["ADMIN"],
    category: "system",
  };
}
