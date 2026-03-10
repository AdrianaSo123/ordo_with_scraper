import { Command } from "./Command";
import { Theme } from "@/components/ThemeProvider";

/**
 * Concrete Command: Handles Theme Switching
 */
export class ThemeCommand implements Command {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly category: string,
    private readonly setTheme: (theme: Theme) => void,
    private readonly themeName: Theme
  ) {}

  execute(): void {
    this.setTheme(this.themeName);
  }
}
