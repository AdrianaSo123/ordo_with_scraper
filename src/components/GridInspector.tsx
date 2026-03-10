"use client";

import { useEffect } from "react";
import { useTheme } from "./ThemeProvider";

export function GridInspector() {
  const { gridEnabled: enabled, setGridEnabled: setEnabled } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "g") {
        setEnabled(!enabled);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, setEnabled]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col">
      {/* Vertical Columns */}
      <div className="absolute inset-0 mx-auto w-full max-w-[var(--container-width)] px-[var(--container-padding)] h-full">
        <div className="grid h-full grid-cols-4 gap-4 sm:grid-cols-8 lg:grid-cols-12 opacity-30">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-full w-full bg-cyan-400/20 border-x border-cyan-400/30 hidden lg:block"
            />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`tb-${i}`}
              className="h-full w-full bg-cyan-400/20 border-x border-cyan-400/30 hidden sm:block lg:hidden"
            />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`mb-${i}`}
              className="h-full w-full bg-cyan-400/20 border-x border-cyan-400/30 sm:hidden"
            />
          ))}
        </div>
      </div>

      {/* Horizontal baselines to prove mathematical rhythm */}
      <div
        className="absolute inset-0 h-full w-full overflow-hidden opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 95%, #06b6d4 100%)",
          backgroundSize: "100% 1rem",
        }}
      ></div>
    </div>
  );
}
