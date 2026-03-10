import { describe, it, expect, vi } from "vitest";
import { ChatPresenter } from "./ChatPresenter";
import type { ChatMessage } from "../core/entities/chat-message";
import type { MarkdownParserService } from "./MarkdownParserService";
import type { CommandParserService } from "./CommandParserService";

describe("ChatPresenter", () => {
  const mockMarkdownParser = {
    parse: vi.fn().mockReturnValue({ blocks: [] }),
  } as unknown as MarkdownParserService;

  const mockCommandParser = {
    parse: vi.fn().mockReturnValue([]),
  } as unknown as CommandParserService;

  it("should transform a ChatMessage into a PresentedMessage", () => {
    const presenter = new ChatPresenter(mockMarkdownParser, mockCommandParser);
    const message: ChatMessage = {
      id: "msg-1",
      role: "assistant",
      content: "Hello __ui_command__:set_theme:bauhaus",
      timestamp: new Date("2023-01-01T12:00:00Z"),
    };

    const presented = presenter.present(message);

    expect(presented.id).toBe("msg-1");
    expect(presented.role).toBe("assistant");
    expect(mockMarkdownParser.parse).toHaveBeenCalledWith(message.content);
    expect(mockCommandParser.parse).toHaveBeenCalledWith(message.content);
    expect(presented.timestamp).toBeDefined();
  });
});
