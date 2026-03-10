import { ToolCommand } from "../ToolCommand";

export class SetThemeCommand implements ToolCommand<{ theme: string }, string> {
  async execute({ theme }: { theme: string }) {
    if (!theme) throw new Error("Theme must be provided.");
    return `Success. The theme has been changed to ${theme}.`;
  }
}

export class NavigateCommand implements ToolCommand<{ path: string }, string> {
  async execute({ path }: { path: string }) {
    if (!path) throw new Error("Path must be provided.");
    return `Success. Navigated to ${path}.`;
  }
}

export class GenerateChartCommand implements ToolCommand<{ code: string }, string> {
  async execute() {
    return `Success. Chart generated and rendered silently on the client.`;
  }
}

export class GenerateAudioCommand implements ToolCommand<{ text: string; title: string }, string> {
  async execute() {
    return `Success. Audio player UI component appended to the chat stream.`;
  }
}
