import React, { useState, useEffect } from "react";
import type { Theme } from "@/components/ThemeProvider";
import { MermaidRenderer } from "@/components/MermaidRenderer";
import { AudioPlayer } from "@/components/AudioPlayer";
import { renderMarkdown } from "./ChatMarkdown";
import { type MessagePart } from "@/hooks/useGlobalChat";

// ---------------------------------------------------------------------------
// Sprint 08 — Relative timestamp utility
// ---------------------------------------------------------------------------
export function useRelativeTime(date: Date) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    function update() {
      const diff = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diff < 10) setLabel("Just now");
      else if (diff < 60) setLabel(`${diff}s ago`);
      else if (diff < 3600) setLabel(`${Math.floor(diff / 60)}m ago`);
      else
        setLabel(
          date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        );
    }
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [date]);
  return label;
}

/** Strips control tags (__suggestions__, __ui_command__) from text before display */
export function stripControlTags(text: string): string {
  return text
    .replace(/__suggestions__:\[.*?\]/g, "")
    .replace(/__ui_command__:[a-z_]+:[^\s]+/g, "")
    .trim();
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2.5 items-end">
      <div className="w-7 h-7 rounded-full bg-[var(--accent-color)]/15 flex items-center justify-center shrink-0 border border-[var(--accent-color)]/20">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      </div>
      <div className="border border-[var(--foreground)]/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce [animation-delay:120ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce [animation-delay:240ms]" />
      </div>
    </div>
  );
}

export function SuggestionChips({
  suggestions,
  onSend,
}: {
  suggestions: string[];
  onSend: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest opacity-70 font-semibold px-1">
        Continue exploring
      </p>
      <div className="flex flex-wrap gap-2.5">
        {suggestions.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => onSend(s)}
            style={{ animationDelay: `${i * 60}ms` }}
            className="group flex items-center gap-2 rounded-full border border-[var(--foreground)]/12 bg-[var(--foreground)]/4 hover:bg-[var(--accent-color)] hover:text-[var(--accent-foreground)] hover:border-[var(--accent-color)] px-4 py-2 text-xs font-semibold transition-all duration-200 active:scale-95 hover:shadow-md animate-in fade-in slide-in-from-bottom-1 focus-ring"
          >
            {s}
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-50 group-hover:opacity-100 transition-opacity"
            >
              <path d="M1 5h8M6 2l3 3-3 3" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemeIndicator({ theme }: { theme: Theme }) {
  const labels: Record<Theme, string> = {
    bauhaus: "🔴 Bauhaus (1919)",
    swiss: "🇨🇭 Swiss Grid (1950s)",
    postmodern: "🌈 Postmodern (1990s)",
    skeuomorphic: "📱 Skeuomorphic (2000s)",
    fluid: "✨ Modern Fluid (Present)",
  };

  return (
    <div className="flex justify-center mt-2">
      <div className="rounded-full border border-[var(--foreground)]/10 bg-[var(--surface)] px-3 py-1 text-xs opacity-60 transition-all shadow-sm">
        Design era: {labels[theme]}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Structred Part Renderer
// ---------------------------------------------------------------------------

function ToolCallItem({
  part,
  isDone,
}: {
  part: Extract<MessagePart, { type: "tool_call" }>;
  isDone: boolean;
}) {
  const isSearch = part.name === "search_books";
  const isCalculator = part.name === "calculator";
  const isChapter =
    part.name === "get_chapter" || part.name === "get_checklist";

  let label = "Using tool...";
  if (isSearch) label = `Searching library for "${part.args.query}"`;
  else if (isCalculator) label = `Calculating equation...`;
  else if (isChapter) label = `Reading book content...`;
  else if (part.name === "set_theme")
    label = `Applying ${String(part.args.theme)} theme...`;
  else if (part.name === "generate_chart") {
    const code = typeof part.args.code === "string" ? part.args.code : "";
    const caption =
      typeof part.args.caption === "string" ? part.args.caption : undefined;
    return (
      <div className="my-2">
        <MermaidRenderer code={code} caption={caption} />
      </div>
    );
  } else if (part.name === "generate_audio") {
    const text = typeof part.args.text === "string" ? part.args.text : "";
    const title = typeof part.args.title === "string" ? part.args.title : "";
    return (
      <div className="my-2 max-w-sm">
        <AudioPlayer text={text} title={title} />
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 px-3 py-2 text-xs opacity-90 shadow-sm transition-all">
        <span
          className={isDone ? "text-green-500/80" : "animate-spin text-[10px]"}
        >
          {isDone ? "✓" : "⚙️"}
        </span>
        <span className="font-mono text-[var(--foreground)]/70">{label}</span>
      </div>
    </div>
  );
}

export function PartList({
  parts,
  fallbackText,
  isStreaming,
}: {
  parts: MessagePart[];
  fallbackText: string;
  isStreaming: boolean;
}) {
  if (!parts || parts.length === 0) {
    return <>{fallbackText ? renderMarkdown(fallbackText) : null}</>;
  }

  // Hide UI command execution results from the user
  const visibleParts = parts.filter((p) => {
    if (
      p.type === "tool_result" &&
      typeof p.result === "string" &&
      p.result.includes("__ui_command__")
    ) {
      return false;
    }
    return true;
  });

  if (visibleParts.length === 0 && fallbackText) {
    return <>{renderMarkdown(fallbackText)}</>;
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleParts.map((part, index) => {
        if (part.type === "text") {
          return (
            <div key={index}>{renderMarkdown(stripControlTags(part.text))}</div>
          );
        }

        if (part.type === "tool_call") {
          // If there's a corresponding tool_result later in the array, it means this call is done.
          const isDone = parts.some(
            (p, i) =>
              i > index && p.type === "tool_result" && p.name === part.name,
          );
          return <ToolCallItem key={index} part={part} isDone={isDone} />;
        }

        return null;
      })}
      {isStreaming && (
        <div className="mt-[-1rem] ml-1">
          <span className="inline-block w-0.5 h-3.5 bg-current opacity-40 align-middle ml-0.5 animate-pulse" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Messaging Bubbles
// ---------------------------------------------------------------------------
export function UserBubble({
  content,
  timestamp,
}: {
  content: string;
  timestamp?: Date;
}) {
  const timeLabel = useRelativeTime(timestamp ?? new Date());
  return (
    <div
      className="flex flex-col items-end gap-1.5 px-2 md:px-0"
      role="listitem"
      aria-label="Your message"
    >
      <div className="max-w-[75%] md:max-w-[65%] bg-[var(--accent-color)] text-[var(--accent-foreground)] rounded-[1.25rem] rounded-br-[0.25rem] px-5 py-3 text-[15px] leading-relaxed shadow-sm transition-all hover:shadow-md">
        {content}
      </div>
      {timestamp && (
        <span
          className="text-[10px] opacity-60 font-medium px-1 uppercase tracking-wider tabular-nums"
          title={timestamp.toLocaleString()}
        >
          {timeLabel}
        </span>
      )}
    </div>
  );
}

export function AssistantBubble({
  parts,
  content,
  isStreaming,
  timestamp,
}: {
  parts?: MessagePart[];
  content: string;
  isStreaming: boolean;
  timestamp?: Date;
}) {
  const timeLabel = useRelativeTime(timestamp ?? new Date());
  return (
    <div
      className="flex justify-start gap-3.5 items-end px-2 md:px-0"
      role="listitem"
      aria-label="Assistant message"
    >
      <div className="w-8 h-8 rounded-full bg-[var(--accent-color)]/8 flex items-center justify-center shrink-0 mb-1 border border-[var(--accent-color)]/10">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      </div>
      <div className="flex flex-col gap-1.5 max-w-[85%] sm:max-w-[80%] w-full">
        <div className="border border-[var(--foreground)]/10 rounded-[1.25rem] rounded-bl-[0.25rem] px-6 py-4.5 text-[15px] leading-[1.7] shadow-sm bg-[var(--surface)] transition-all hover:shadow-md">
          <PartList
            parts={parts || []}
            fallbackText={content}
            isStreaming={isStreaming}
          />
        </div>
        {!isStreaming && timestamp && (
          <span
            className="text-[10px] opacity-60 font-medium px-1 uppercase tracking-wider tabular-nums"
            title={timestamp.toLocaleString()}
          >
            {timeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
