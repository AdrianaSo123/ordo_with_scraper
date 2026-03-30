// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter, Readable } from "stream";
import type { ChildProcess } from "child_process";

import { createMockChild } from "./helpers";

// Mock child_process.spawn — no Docker process is ever started.
const mockSpawn = vi.fn();
vi.mock("child_process", () => ({ spawn: (...args: unknown[]) => mockSpawn(...args) }));

import {
  executeGetCapitalEvents,
  CAPITAL_EVENT_TYPES,
  McpInvocationError,
} from "../../mcp/capital-intelligence-tool";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("capital-intelligence-tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    mockSpawn.mockReturnValueOnce(
      createMockChild({ stdoutData: JSON.stringify({ success: true, data: events }) }).child,
    );

    const result = await executeGetCapitalEvents({ limit: 10 });
    expect(result).toEqual({ results: events });
  });

  // --- Empty results ---

  it("returns { results: [] } for empty data array", async () => {
    mockSpawn.mockReturnValueOnce(
      createMockChild({ stdoutData: JSON.stringify({ success: true, data: [] }) }).child,
    );

    const result = await executeGetCapitalEvents({ limit: 5 });
    expect(result).toEqual({ results: [] });
  });

  // --- MCP failure response ---

  it("throws McpInvocationError when MCP returns success: false", async () => {
    mockSpawn.mockReturnValueOnce(
      createMockChild({
        stdoutData: JSON.stringify({ success: false, error: "Database unavailable" }),
      }).child,
    );

    await expect(
      executeGetCapitalEvents({ limit: 10 }),
    ).rejects.toThrow("Database unavailable");
  });

  // --- Non-zero exit code ---

  it("throws McpInvocationError on non-zero exit code", async () => {
    mockSpawn.mockReturnValueOnce(
      createMockChild({ exitCode: 1, stderrData: "container error" }).child,
    );

    await expect(
      executeGetCapitalEvents({ limit: 10 }),
    ).rejects.toThrow(McpInvocationError);
  });

  // --- Malformed JSON ---

  it("throws McpInvocationError on malformed JSON response", async () => {
    mockSpawn.mockReturnValueOnce(
      createMockChild({ stdoutData: "not valid json" }).child,
    );

    await expect(
      executeGetCapitalEvents({ limit: 10 }),
    ).rejects.toThrow(McpInvocationError);
  });

  // --- Docker spawn failure ---

  it("throws McpInvocationError when spawn fails", async () => {
    const child = new EventEmitter() as ChildProcess;
    Object.assign(child, {
      stdout: new Readable({ read() {} }),
      stderr: new Readable({ read() {} }),
      stdin: { write: vi.fn(), end: vi.fn() },
      kill: vi.fn(),
    });
    setTimeout(() => child.emit("error", new Error("Docker not found")), 0);
    mockSpawn.mockReturnValueOnce(child);

    await expect(
      executeGetCapitalEvents({ limit: 10 }),
    ).rejects.toThrow("Failed to spawn Docker process");
  });

  // --- Payload format ---

  it("sends correct JSON payload to stdin", async () => {
    const { child, getCapturedStdin } = createMockChild({
      stdoutData: JSON.stringify({ success: true, data: [] }),
    });
    mockSpawn.mockReturnValueOnce(child);

    await executeGetCapitalEvents({ limit: 20, event_type: "funding" });

    expect(JSON.parse(getCapturedStdin())).toEqual({
      tool: "get_capital_events",
      arguments: { limit: 20, event_type: "funding" },
    });
  });

  it("omits event_type from payload when not provided", async () => {
    const { child, getCapturedStdin } = createMockChild({
      stdoutData: JSON.stringify({ success: true, data: [] }),
    });
    mockSpawn.mockReturnValueOnce(child);

    await executeGetCapitalEvents({ limit: 5 });

    expect(JSON.parse(getCapturedStdin())).toEqual({
      tool: "get_capital_events",
      arguments: { limit: 5 },
    });
  });

  // --- Environment Injection ---

  it("passes environment variables to docker run via -e flags", async () => {
    mockSpawn.mockReturnValueOnce(
      createMockChild({ stdoutData: JSON.stringify({ success: true, data: [] }) }).child,
    );

    await executeGetCapitalEvents({ limit: 10 }, {
      env: { KEY1: "VAL1", KEY2: "VAL2" },
    });

    const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
    expect(spawnArgs).toContain("-e");
    expect(spawnArgs).toContain("KEY1=VAL1");
    expect(spawnArgs).toContain("KEY2=VAL2");
  });
});
