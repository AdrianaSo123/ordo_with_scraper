// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetCapitalEventsCommand } from "../../src/core/use-cases/tools/CapitalIntelligenceTool";
import type { CapitalEventsExecutor } from "../../src/core/use-cases/tools/CapitalIntelligenceTool";
import { ADMIN_CONTEXT } from "./helpers";

// ---------------------------------------------------------------------------
// With DIP, we inject a mock executor directly — no vi.mock() needed!
// ---------------------------------------------------------------------------

const mockExecutor: CapitalEventsExecutor = vi.fn();

describe("GetCapitalEventsCommand", () => {
  let command: GetCapitalEventsCommand;

  beforeEach(() => {
    vi.clearAllMocks();
    command = new GetCapitalEventsCommand(mockExecutor);
  });

  // --- Input validation ---

  it("rejects limit below 1", async () => {
    await expect(
      command.execute({ limit: 0 }, ADMIN_CONTEXT),
    ).rejects.toThrow("limit must be an integer between 1 and 100");
  });

  it("rejects limit above 100", async () => {
    await expect(
      command.execute({ limit: 101 }, ADMIN_CONTEXT),
    ).rejects.toThrow("limit must be an integer between 1 and 100");
  });

  it("rejects non-integer limit", async () => {
    await expect(
      command.execute({ limit: 10.5 }, ADMIN_CONTEXT),
    ).rejects.toThrow("limit must be an integer between 1 and 100");
  });

  it("rejects negative limit", async () => {
    await expect(
      command.execute({ limit: -1 }, ADMIN_CONTEXT),
    ).rejects.toThrow("limit must be an integer between 1 and 100");
  });

  it("rejects invalid event_type", async () => {
    await expect(
      command.execute({ limit: 10, event_type: "invalid_type" }, ADMIN_CONTEXT),
    ).rejects.toThrow("event_type must be one of:");
  });

  it("accepts valid event_type values", async () => {
    (mockExecutor as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ results: [] });
    await expect(
      command.execute({ limit: 10, event_type: "funding" }, ADMIN_CONTEXT),
    ).resolves.toEqual({ results: [] });
  });

  // --- Default limit ---

  it("defaults limit to 10 when omitted", async () => {
    (mockExecutor as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ results: [] });
    await command.execute({}, ADMIN_CONTEXT);
    expect(mockExecutor).toHaveBeenCalledWith({ limit: 10 });
  });

  // --- Passthrough ---

  it("passes validated args to the executor", async () => {
    (mockExecutor as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ results: [{ id: "e1" }] });

    const result = await command.execute(
      { limit: 25, event_type: "acquisition" },
      ADMIN_CONTEXT,
    );

    expect(mockExecutor).toHaveBeenCalledWith({ limit: 25, event_type: "acquisition" });
    expect(result).toEqual({ results: [{ id: "e1" }] });
  });

  // --- Error handling (Graceful degradation) ---

  it("returns an error message instead of throwing on executor failure", async () => {
    (mockExecutor as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("MCP process exited with code 1")
    );

    const result = await command.execute({ limit: 10 }, ADMIN_CONTEXT);
    
    expect(result.results).toEqual([]);
    expect(result.error).toContain("service is currently unavailable");
    expect(result.error).toContain("MCP process exited with code 1");
  });

  it("still throws validation errors (they are not infrastructure failures)", async () => {
    await expect(
      command.execute({ limit: 0 }, ADMIN_CONTEXT)
    ).rejects.toThrow("limit must be");
    
    expect(mockExecutor).not.toHaveBeenCalled();
  });

  // --- Executor is never called when validation fails ---

  it("never calls executor when validation fails", async () => {
    await command.execute({ limit: 0 }, ADMIN_CONTEXT).catch(() => {});
    await command.execute({ limit: 10, event_type: "bogus" }, ADMIN_CONTEXT).catch(() => {});
    expect(mockExecutor).not.toHaveBeenCalled();
  });

  // --- Response structure ---

  it("returns { results: [...] } format", async () => {
    (mockExecutor as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      results: [
        { event_type: "funding", company: "Acme" },
        { event_type: "contract", company: "Beta" },
      ],
    });

    const result = await command.execute({ limit: 10 }, ADMIN_CONTEXT);
    expect(result).toHaveProperty("results");
    expect(result.results).toHaveLength(2);
  });

  it("returns { results: [] } for empty data", async () => {
    (mockExecutor as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ results: [] });
    const result = await command.execute({ limit: 5 }, ADMIN_CONTEXT);
    expect(result).toEqual({ results: [] });
  });
});
