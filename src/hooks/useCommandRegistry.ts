import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { commandRegistry } from "@/core/commands/CommandRegistry";
import { NavigationCommand } from "@/core/commands/NavigationCommands";
import { ThemeCommand } from "@/core/commands/ThemeCommands";
import type { Command } from "@/core/commands/Command";

class PlaceholderCommand implements Command {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly category: string,
  ) {}
  execute() { /* no-op placeholder */ }
}

/**
 * Registers all application commands (navigation, themes, tools)
 * into the shared CommandRegistry singleton.
 */
export function useCommandRegistry() {
  const router = useRouter();
  const { setTheme } = useTheme();

  useMemo(() => {
    const navigate = (path: string) => router.push(path);

    // Navigation
    commandRegistry.register(new NavigationCommand("library", "Go to Library", "Navigation", navigate, "/books"));
    commandRegistry.register(new NavigationCommand("training", "Go to Training", "Navigation", navigate, "/training"));
    commandRegistry.register(new NavigationCommand("studio", "Go to Studio", "Navigation", navigate, "/studio"));

    // Themes
    commandRegistry.register(new ThemeCommand("theme-fluid", "Set Theme: Fluid", "Themes", setTheme, "fluid"));
    commandRegistry.register(new ThemeCommand("theme-swiss", "Set Theme: Swiss Grid", "Themes", setTheme, "swiss"));
    commandRegistry.register(new ThemeCommand("theme-bauhaus", "Set Theme: Bauhaus", "Themes", setTheme, "bauhaus"));
    commandRegistry.register(new ThemeCommand("theme-postmodern", "Set Theme: Postmodern", "Themes", setTheme, "postmodern"));
    commandRegistry.register(new ThemeCommand("theme-skeuomorphic", "Set Theme: Skeuomorphic", "Themes", setTheme, "skeuomorphic"));

    // Tools (placeholder commands)
    commandRegistry.register(new PlaceholderCommand("search", "Search Library", "Tools"));
    commandRegistry.register(new PlaceholderCommand("checklists", "Get Checklists", "Tools"));
    commandRegistry.register(new PlaceholderCommand("practitioners", "List Practitioners", "Tools"));
  }, [router, setTheme]);
}
