// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the MCP SDK — the implementation uses Client + StdioClientTransport.
// Mocking child_process.spawn would not intercept the SDK's internal transport.
// vi.hoisted() ensures mocks are available when vi.mock factories run (hoisted).
// ---------------------------------------------------------------------------

const { MockClient, MockStdioClientTransport, mockCallTool, mockConnect, mockClose } =
  vi.hoisted(() => {
    const mockCallTool = vi.fn();
    const mockConnect = vi.fn();
    const mockClose = vi.fn();
    const MockClient = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
      this.connect = mockConnect;
      this.callTool = mockCallTool;
      this.close = mockClose;
    });
    const MockStdioClientTransport = vi.fn();
    return { MockClient, MockStdioClientTransport, mockCallTool, mockConnect, mockClose };
  });

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({ Client: MockClient }));
vi.mock("@modelcontextprotocol/sdk/client/stdio.js", () => ({ StdioClientTransport: MockStdioClientTransport }));

import {
  executeGetCapitalEvents,
  CAPITAL_EVENT_TYPES,
  McpInvocationError,
} from "../../mcp/capital-intelligence-tool";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTextResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("capital-intelligence-tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
  });

  // --- Canonical event types ---

  it("CAPITAL_EVENT_TYPES is the single source of truth", () => {
    expect(CAPITAL_EVENT_TYPES).toEqual([
      "funding", "acquisition", "partnership", "contract", "restructuring", "other",
    ]);
    expect(CAPITAL_EVENT_TYPES).toHaveLength(6);
  });

  // --- Successful MCP response ---

  it("translates a successful MCP response to { results: [...] }", async () => {
    const events = [
      { event_type: "funding", company: "Acme Corp", amount: 10_000_000 },
      { event_type: "acquisition", company: "Beta Inc", amount: 5_000_000 },
    ];
    mockCallTool.mockResolvedValueOnce(
      makeTextResult(JSON.stringify({ success: true, data: events })),
    );

    const result = await executeGetCapitalEvents({ limit: 10 });
    expect(result).toEqual({ results: events });
  });

  // --- Empty results ---

  it("returns { results: [] } for empty data array", async () => {
    mockCallTool.mockResolvedValueOnce(
      makeTextResult(JSON.stringify({ success: true, data: [] })),
    );

    const result = await executeGetCapitalEvents({ limit: 5 });
    expect(result).toEqual({ results: [] });
  });

  // --- MCP failure response ---

  it("throws McpInvocationError when MCP returns success: false", async () => {
    mockCallTool.mockResolvedValueOnce(
      makeTextResult(JSON.stringify({ success: false, error: "Database unavailable" })),
    );

    await expect(
      executeGetCapitalEvents({ limit: 10 }),
    ).rejects.toThrow("Database unavailable");
  });

  // --- Transport connection failure ---

  it("throws McpInvocationError when transport fails to connect", async () => {
    mockConnect.mockRejectedValueOnce(new Error("connection refused"));

    await expect(
      executeGetCapitalEvents({ limit: 10 }),
    ).rejects.toThrow(McpInvocationError);
  });

  // --- Malformed JSON ---

  it("throws McpInvocationError on malformed JSON response", async () => {
    mockCallTool.mockResolvedValueOnce(makeTextResult("not valid json"));

    await expect(
      executeGetCapitalEvents({ limit: 10 }),
    ).rejects.toThrow(McpInvocationError);
  });

  // --- Docker unavailable ---

  it("throws McpInvocationError when Docker is unavailable", async () => {
    mockConnect.mockRejectedValueOnce(new Error("Docker not found"));

    await expect(
      executeGetCapitalEvents({ limit: 10 }),
    ).rejects.toThrow(McpInvocationError);
  });

  // --- Tool call arguments ---

  it("calls the MCP tool with correct name and arguments", async () => {
    mockCallTool.mockResolvedValueOnce(
      makeTextResult(JSON.stringify({ success: true, data: [] })),
    );

    await executeGetCapitalEvents({ limit: 20, event_type: "funding" });

    expect(mockCallTool).toHaveBeenCalledWith({
      name: "get_capital_events",
      arguments: { limit: 20, event_type: "funding" },
    });
  });

  it("omits event_type from arguments when not provided", async () => {
    mockCallTool.mockResolvedValueOnce(
      makeTextResult(JSON.stringify({ success: true, data: [] })),
    );

    await executeGetCapitalEvents({ limit: 5 });

    expect(mockCallTool).toHaveBeenCalledWith({
      name: "get_capital_events",
      arguments: { limit: 5 },
    });
  });

  // --- Environment Injection ---

  it("passes environment variables to the Docker transport via -e flags", async () => {
    mockCallTool.mockResolvedValueOnce(
      makeTextResult(JSON.stringify({ success: true, data: [] })),
    );

    await executeGetCapitalEvents({ limit: 10 }, {
      env: { KEY1: "VAL1", KEY2: "VAL2" },
    });

    const transportArgs = MockStdioClientTransport.mock.calls[0][0] as { args: string[] };
    expect(transportArgs.args).toContain("-e");
    expect(transportArgs.args).toContain("KEY1=VAL1");
    expect(transportArgs.args).toContain("KEY2=VAL2");
  });
});
