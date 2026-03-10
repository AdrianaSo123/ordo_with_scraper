import { describe, expect, it } from "vitest";
import { createToolResults } from "@/lib/chat/tools";

describe("chat tools", () => {
  it("builds successful tool result payload", async () => {
    const results = await createToolResults([
      {
        type: "tool_use",
        id: "tool_1",
        name: "calculator",
        input: { operation: "add", a: 2, b: 3 },
      },
    ] as never);

    expect(results[0].type).toBe("tool_result");
    expect(results[0].tool_use_id).toBe("tool_1");
    expect(results[0].content).toContain('"result":5');
  });

  it("builds error tool result payload for bad input", async () => {
    const results = await createToolResults([
      {
        type: "tool_use",
        id: "tool_2",
        name: "calculator",
        input: { operation: "pow", a: 2, b: 3 },
      },
    ] as never);

    expect(results[0].type).toBe("tool_result");
    expect(results[0].is_error).toBe(true);
  });

  it("builds error for unknown tool", async () => {
    const results = await createToolResults([
      {
        type: "tool_use",
        id: "tool_3",
        name: "unknown_tool",
        input: {},
      },
    ] as never);

    expect(results[0].is_error).toBe(true);
    expect(results[0].content).toContain("Unknown tool");
  });
});
