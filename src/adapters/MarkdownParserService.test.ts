import { describe, it, expect } from "vitest";
import { MarkdownParserService } from "./MarkdownParserService";
import type { BlockNode, InlineNode } from "../core/entities/rich-content";

describe("MarkdownParserService", () => {
  const parser = new MarkdownParserService();

  it("should parse a simple paragraph", () => {
    const result = parser.parse("Hello world");
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toMatchObject({
      type: "paragraph",
      content: [{ type: "text", text: "Hello world" }],
    });
  });

  it("should parse inlines (bold, code, links)", () => {
    const result = parser.parse("Hello **bold** and `code` with [[slug]]");
    const p = result.blocks[0] as Extract<BlockNode, { type: "paragraph" }>;
    expect(p.content).toHaveLength(6);
    expect(p.content[1]).toEqual({ type: "bold", text: "bold" });
    expect(p.content[3]).toEqual({ type: "code-inline", text: "code" });
    expect(p.content[5]).toEqual({ type: "library-link", slug: "slug" });
  });

  it("should parse headings", () => {
    const result = parser.parse("# H1\n## H2\n### H3");
    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0].type).toBe("heading");
    expect((result.blocks[0] as Extract<BlockNode, { type: "heading" }>).level).toBe(1);
  });

  it("should parse lists", () => {
    const result = parser.parse("- item 1\n- item 2");
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe("list");
    expect((result.blocks[0] as Extract<BlockNode, { type: "list" }>).items).toHaveLength(2);
  });

  it("should parse code blocks", () => {
    const result = parser.parse("```ts\nconst x = 1;\n```");
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toMatchObject({
      type: "code-block",
      code: "const x = 1;",
      language: "ts",
    });
  });

  it("should parse tables", () => {
    const markdown = "| H1 | H2 |\n|---|---|\n| C1 | C2 |";
    const result = parser.parse(markdown);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe("table");
    const table = result.blocks[0] as Extract<BlockNode, { type: "table" }>;
    expect(table.header).toHaveLength(2);
    expect(table.rows).toHaveLength(1);
    expect((table.rows[0][0][0] as Extract<InlineNode, { type: "text" }>).text).toBe("C1");
  });
});
