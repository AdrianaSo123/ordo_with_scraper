// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the MCP SDK — the implementation uses Client + StdioClientTransport.
// Mocking child_process.spawn would not intercept the SDK's internal transport.
// vi.hoisted() ensures mocks are available when vi.mock factories run (hoisted).
// ---------------------------------------------------------------------------

const { MockClient, MockStdioClientTransport, mockCallTool, mockConnect, mockClose, mockWriteFileSync, mockUnlinkSync } =
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
    const mockWriteFileSync = vi.fn();
    const mockUnlinkSync = vi.fn();
    return { MockClient, MockStdioClientTransport, mockCallTool, mockConnect, mockClose, mockWriteFileSync, mockUnlinkSync };
  });

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({ Client: MockClient }));
vi.mock("@modelcontextprotocol/sdk/client/stdio.js", () => ({ StdioClientTransport: MockStdioClientTransport }));
vi.mock("node:fs", () => ({ writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }));
vi.mock("node:os", () => ({ tmpdir: () => "/tmp" }));

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
    mockWriteFileSync.mockReturnValue(undefined);
    mockUnlinkSync.mockReturnValue(undefined);
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
      { id: "e1", event_type: "funding", company: "Acme Corp", amount: 10_000_000, date: "2026-01-15", description: "Series B round", source_url: "https://example.com/1" },
      { id: "e2", event_type: "acquisition", company: "Beta Inc", amount: 5_000_000, date: "2026-02-01", description: "Acquired by Acme", source_url: "https://example.com/2" },
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

  // --- Malformed event validation ---

  it("throws McpInvocationError when events are missing required fields", async () => {
    const malformedEvents = [
      { event_type: "funding", company: "Acme Corp" }, // missing id, date, description, source_url
    ];
    mockCallTool.mockResolvedValueOnce(
      makeTextResult(JSON.stringify({ success: true, data: malformedEvents })),
    );

    await expect(
      executeGetCapitalEvents({ limit: 10 }),
    ).rejects.toThrow(/malformed event/);
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

  // --- Connect timeout (the connect() phase hangs forever) ---

  it("throws McpInvocationError when connect() exceeds the deadline", async () => {
    // connect() never resolves — simulates a Docker cold-start hang
    mockConnect.mockImplementationOnce(() => new Promise(() => {}));

    await expect(
      executeGetCapitalEvents({ limit: 10 }, { timeoutMs: 50 }),
    ).rejects.toThrow(/timed out after 50ms/);
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

  it("writes credentials to a temp file and passes --env-file to Docker (avoids ps aux exposure)", async () => {
    mockCallTool.mockResolvedValueOnce(
      makeTextResult(JSON.stringify({ success: true, data: [] })),
    );

    await executeGetCapitalEvents({ limit: 10 }, {
      env: { KEY1: "VAL1", KEY2: "VAL2" },
    });

    // Must use --env-file, not -e flags
    const transportArgs = MockStdioClientTransport.mock.calls[0][0] as { args: string[] };
    expect(transportArgs.args).toContain("--env-file");
    expect(transportArgs.args).not.toContain("-e");

    // Env file written with restricted permissions to avoid world-readability
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("ordo-mcp-"),
      "KEY1=VAL1\nKEY2=VAL2",
      { mode: 0o600 },
    );

    // Env file cleaned up in finally regardless of success/failure
    const envFilePath = transportArgs.args[transportArgs.args.indexOf("--env-file") + 1];
    expect(mockUnlinkSync).toHaveBeenCalledWith(envFilePath);
  });

  // --- N-7: env file cleanup on failure path ---

  it("removes the env file even when connect() rejects", async () => {
    mockConnect.mockRejectedValueOnce(new Error("Docker not found"));

    await expect(
      executeGetCapitalEvents({ limit: 10 }, { env: { KEY: "VAL" } }),
    ).rejects.toThrow(McpInvocationError);

    expect(mockUnlinkSync).toHaveBeenCalled();
  });

  // --- N-2: newline injection guard ---

  it("throws McpInvocationError when an env value contains a newline", async () => {
    await expect(
      executeGetCapitalEvents({ limit: 10 }, { env: { KEY: "value\nINJECTED=bad" } }),
    ).rejects.toThrow(/contains a newline/);

    // File must not have been written
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  // --- N-3: success field missing treated as failure ---

  it("throws McpInvocationError when MCP response omits the success field", async () => {
    mockCallTool.mockResolvedValueOnce(
      makeTextResult(JSON.stringify({ data: [{ id: "e1" }] })), // no 'success' key
    );

    await expect(
      executeGetCapitalEvents({ limit: 10 }),
    ).rejects.toThrow(/non-success response/);
  });

  // --- T-1: env key validation ---

  it("throws McpInvocationError when an env key contains '='", async () => {
    await expect(
      executeGetCapitalEvents({ limit: 10 }, { env: { "FOO=BAR": "value" } }),
    ).rejects.toThrow(/invalid character/);

    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it("throws McpInvocationError when an env key contains a newline", async () => {
    await expect(
      executeGetCapitalEvents({ limit: 10 }, { env: { "KEY\nINJECTED": "value" } }),
    ).rejects.toThrow(/invalid character/);

    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  // --- T-2: empty image guard ---

  it("throws McpInvocationError when CAPITAL_MCP_IMAGE is set to empty string", async () => {
    const original = process.env.CAPITAL_MCP_IMAGE;
    process.env.CAPITAL_MCP_IMAGE = "";
    try {
      await expect(
        executeGetCapitalEvents({ limit: 10 }),
      ).rejects.toThrow(/empty string/);
    } finally {
      if (original === undefined) {
        delete process.env.CAPITAL_MCP_IMAGE;
      } else {
        process.env.CAPITAL_MCP_IMAGE = original;
      }
    }
  });

  // --- T-4: error cause is preserved ---

  it("wraps unexpected errors as McpInvocationError with the original as cause", async () => {
    const rootCause = new Error("ECONNRESET");
    mockConnect.mockRejectedValueOnce(rootCause);

    let thrown: unknown;
    try {
      await executeGetCapitalEvents({ limit: 10 }, { env: { KEY: "VAL" } });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(McpInvocationError);
    expect((thrown as McpInvocationError & { cause: unknown }).cause).toBe(rootCause);
  });

  // --- R4-2: empty env skips env file write ---

  it("does not write an env file when no credentials are provided", async () => {
    mockCallTool.mockResolvedValueOnce(makeTextResult(JSON.stringify({ success: true, data: [] })));

    await executeGetCapitalEvents({ limit: 5 });

    expect(mockWriteFileSync).not.toHaveBeenCalled();

    const transportArgs = MockStdioClientTransport.mock.calls[0][0] as { args: string[] };
    expect(transportArgs.args).not.toContain("--env-file");
  });

  // --- R4-5: close with deadline ---

  it("resolves the finally block even when close() hangs indefinitely", async () => {
    // close() never resolves — the 2 second deadline in closeWithDeadline must unblock it.
    mockClose.mockReturnValueOnce(new Promise(() => {}));
    mockCallTool.mockResolvedValueOnce(makeTextResult(JSON.stringify({ success: true, data: [] })));

    // Should complete quickly (the deadline races the hung close).
    await expect(
      executeGetCapitalEvents({ limit: 10 }),
    ).resolves.toMatchObject({ results: expect.any(Array) });
  });
});
