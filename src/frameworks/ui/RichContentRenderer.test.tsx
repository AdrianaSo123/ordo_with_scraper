import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { RichContentRenderer } from "./RichContentRenderer";
import type { RichContent } from "../../core/entities/rich-content";

describe("RichContentRenderer", () => {
  it("should render a paragraph", () => {
    const content: RichContent = {
      blocks: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    };

    render(<RichContentRenderer content={content} />);
    expect(screen.getByText("Hello world")).toBeDefined();
  });

  it("should render bold text", () => {
    const content: RichContent = {
      blocks: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "This is " },
            { type: "bold", text: "bold" },
          ],
        },
      ],
    };

    render(<RichContentRenderer content={content} />);
    const bold = screen.getByText("bold");
    expect(bold.tagName).toBe("STRONG");
  });

  it("should render a library link and handle clicks", () => {
    const onClick = vi.fn();
    const content: RichContent = {
      blocks: [
        {
          type: "paragraph",
          content: [{ type: "library-link", slug: "my-chapter" }],
        },
      ],
    };

    render(<RichContentRenderer content={content} onLinkClick={onClick} />);
    const link = screen.getByText("my chapter");
    link.click();
    expect(onClick).toHaveBeenCalledWith("my-chapter");
  });

  it("should render a list", () => {
    const content: RichContent = {
      blocks: [
        {
          type: "list",
          items: [
            [{ type: "text", text: "item 1" }],
            [{ type: "text", text: "item 2" }],
          ],
        },
      ],
    };

    render(<RichContentRenderer content={content} />);
    expect(screen.getByText("item 1")).toBeDefined();
    expect(screen.getByText("item 2")).toBeDefined();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
