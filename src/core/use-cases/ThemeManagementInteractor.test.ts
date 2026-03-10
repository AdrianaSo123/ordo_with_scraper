import { describe, it, expect } from "vitest";
import { ThemeManagementInteractor } from "./ThemeManagementInteractor";

describe("ThemeManagementInteractor", () => {
  it("should validate valid themes", () => {
    const interactor = new ThemeManagementInteractor();
    expect(interactor.validateTheme("bauhaus")).toBe(true);
    expect(interactor.validateTheme("invalid")).toBe(false);
  });

  it("should return metadata for a theme", () => {
    const interactor = new ThemeManagementInteractor();
    const meta = interactor.getThemeMetadata("bauhaus");
    expect(meta.name).toBe("Bauhaus");
    expect(meta.primaryAttributes).toContain("Geometry");
  });

  it("should return all themes", () => {
    const interactor = new ThemeManagementInteractor();
    const themes = interactor.getAllThemes();
    expect(themes).toHaveLength(5);
    expect(themes[0].id).toBeDefined();
  });
});
