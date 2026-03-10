import type {
  RichContent,
  BlockNode,
  InlineNode,
} from "../core/entities/rich-content";
import { BLOCK_TYPES, INLINE_TYPES } from "../core/entities/rich-content";

export class MarkdownParserService {
  parse(markdown: string): RichContent {
    const lines = markdown.split("\n");
    const blocks: BlockNode[] = [];

    let listBuffer: string[] = [];
    let tableBuffer: string[][] = [];
    let tableHasHeader = false;
    let codeBuffer: string[] = [];
    let codeLang = "";
    let inCode = false;

    const flushList = () => {
      if (listBuffer.length > 0) {
        blocks.push({
          type: BLOCK_TYPES.LIST,
          items: listBuffer.map((item) => this.parseInlines(item)),
        });
        listBuffer = [];
      }
    };

    const flushTable = () => {
      if (tableBuffer.length > 0) {
        const header = tableHasHeader
          ? tableBuffer[0].map((c) => this.parseInlines(c))
          : undefined;
        const rows = (tableHasHeader ? tableBuffer.slice(1) : tableBuffer).map(
          (row) => row.map((cell) => this.parseInlines(cell)),
        );

        blocks.push({ type: BLOCK_TYPES.TABLE, header, rows });
        tableBuffer = [];
        tableHasHeader = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("```")) {
        if (!inCode) {
          flushList();
          flushTable();
          codeLang = trimmed.slice(3).trim();
          inCode = true;
          codeBuffer = [];
        } else {
          blocks.push({
            type: BLOCK_TYPES.CODE,
            code: codeBuffer.join("\n"),
            language: codeLang,
          });
          codeBuffer = [];
          inCode = false;
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(line);
        continue;
      }

      if (trimmed.startsWith("|")) {
        if (this.isTableSeparator(trimmed)) {
          tableHasHeader = true;
        } else {
          tableBuffer.push(this.parseTableRow(trimmed));
        }
        continue;
      } else if (tableBuffer.length > 0) {
        flushTable();
      }

      if (trimmed.startsWith("### ")) {
        flushList();
        blocks.push({
          type: BLOCK_TYPES.HEADING,
          level: 3,
          content: this.parseInlines(trimmed.slice(4)),
        });
      } else if (trimmed.startsWith("## ")) {
        flushList();
        blocks.push({
          type: BLOCK_TYPES.HEADING,
          level: 2,
          content: this.parseInlines(trimmed.slice(3)),
        });
      } else if (trimmed.startsWith("# ")) {
        flushList();
        blocks.push({
          type: BLOCK_TYPES.HEADING,
          level: 1,
          content: this.parseInlines(trimmed.slice(2)),
        });
      } else if (trimmed.startsWith("> ")) {
        flushList();
        blocks.push({
          type: BLOCK_TYPES.BLOCKQUOTE,
          content: this.parseInlines(trimmed.slice(2)),
        });
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        listBuffer.push(trimmed.slice(2));
      } else if (trimmed === "---" || trimmed === "***") {
        flushList();
        blocks.push({ type: BLOCK_TYPES.DIVIDER });
      } else if (!trimmed) {
        flushList();
      } else {
        flushList();
        blocks.push({ type: BLOCK_TYPES.PARAGRAPH, content: this.parseInlines(trimmed) });
      }
    }

    flushList();
    flushTable();
    return { blocks };
  }

  private parseInlines(text: string): InlineNode[] {
    const nodes: InlineNode[] = [];
    const combined = /(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]]+\]\])/g;
    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = combined.exec(text)) !== null) {
      if (m.index > last) {
        nodes.push({ type: INLINE_TYPES.TEXT, text: text.slice(last, m.index) });
      }

      const match = m[0];
      if (match.startsWith("**")) {
        nodes.push({ type: INLINE_TYPES.BOLD, text: match.slice(2, -2) });
      } else if (match.startsWith("`")) {
        nodes.push({ type: INLINE_TYPES.CODE, text: match.slice(1, -1) });
      } else if (match.startsWith("[[")) {
        nodes.push({ type: INLINE_TYPES.LINK, slug: match.slice(2, -2) });
      }

      last = m.index + match.length;
    }

    if (last < text.length) {
      nodes.push({ type: INLINE_TYPES.TEXT, text: text.slice(last) });
    }

    return nodes.length > 0 ? nodes : [{ type: INLINE_TYPES.TEXT, text }];
  }

  private parseTableRow(line: string): string[] {
    return line
      .split("|")
      .map((cell) => cell.trim())
      .filter(
        (_, i, arr) =>
          !(i === 0 && _ === "") && !(i === arr.length - 1 && _ === ""),
      );
  }

  private isTableSeparator(line: string): boolean {
    return (
      /^\|[\s|\-:]+\|$/.test(line.trim()) ||
      /^[\-:]+(\|[\-:\s]*)+$/.test(line.trim())
    );
  }
}
