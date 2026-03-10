import { Command } from "./Command";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Concrete Command: Handles Navigation
 */
export class NavigationCommand implements Command {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly category: string,
    private readonly router: AppRouterInstance,
    private readonly path: string
  ) {}

  execute(): void {
    this.router.push(this.path);
  }
}
