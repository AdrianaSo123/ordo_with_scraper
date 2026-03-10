// @vitest-environment jsdom

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { AudioPlayer } from "./AudioPlayer";
import React from "react";

describe("AudioPlayer", () => {
  let mockPlay: Mock;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockPlay = vi.fn().mockResolvedValue(undefined);
    // Mock Audio
    class MockAudio {
      play = mockPlay;
      pause = vi.fn();
      currentTime = 0;
      duration = 100;
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
    }
    vi.stubGlobal("Audio", MockAudio);

    // Mock URL
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:test"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("fetches and plays audio when play button is clicked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["test"], { type: "audio/mpeg" }),
      }),
    );

    render(<AudioPlayer title="Test Audio" text="Hello world" />);

    // The play button is just a button in ToolCard's children
    const buttons = screen.getAllByRole("button");
    // Expand ToolCard first if needed, though children should be visible
    // We know the play toggle is the one with w-12 h-12 classes
    // Let's just click the play button
    const playButton = buttons[buttons.length - 1]; // Actually, it disables based on isLoading

    fireEvent.click(playButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/tts", expect.any(Object));
      expect(mockPlay).toHaveBeenCalled();
    });
  });

  it("handles fetch errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    render(<AudioPlayer title="Test Audio" text="Hello world" />);

    const buttons = screen.getAllByRole("button");
    const playButton = buttons[buttons.length - 1];
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to stream audio/i)).toBeInTheDocument();
    });
  });
});
