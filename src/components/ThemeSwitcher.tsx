"use client";

import { useTheme, type Theme } from "./ThemeProvider";

const THEMES: { id: Theme; label: string }[] = [
  { id: "bauhaus", label: "Bauhaus (1919)" },
  { id: "swiss", label: "Swiss Grid (1950s)" },
  { id: "postmodern", label: "Postmodern (1990s)" },
  { id: "skeuomorphic", label: "Skeuomorphic (2000s)" },
  { id: "fluid", label: "Modern Fluid (Present)" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Temporal Interface
      </div>
      <div className="flex flex-wrap gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`
              rounded-md px-3 py-1.5 text-xs font-medium transition-all
              ${
                theme === t.id
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }
            `}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
