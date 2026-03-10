export type ThemeEra =
  | "bauhaus"
  | "swiss"
  | "postmodern"
  | "skeuomorphic"
  | "fluid";

export interface ThemeMetadata {
  id: ThemeEra;
  name: string;
  description: string;
  yearRange: string;
  primaryAttributes: string[];
}

export class ThemeManagementInteractor {
  private eras: Record<ThemeEra, ThemeMetadata> = {
    bauhaus: {
      id: "bauhaus",
      name: "Bauhaus",
      description: "Functionalism, grid-based, bold primary colors.",
      yearRange: "1919-1933",
      primaryAttributes: ["Geometry", "Primary Colors", "San-serif"],
    },
    swiss: {
      id: "swiss",
      name: "Swiss Style",
      description: "Cleanliness, readability, and objectivity.",
      yearRange: "1950s-1960s",
      primaryAttributes: ["Asymmetric Layouts", "Grid", "Sans-serif Typo"],
    },
    postmodern: {
      id: "postmodern",
      name: "Post-Modern",
      description: "Vibrant colors, mixed styles, and expressive.",
      yearRange: "1970s-1980s",
      primaryAttributes: ["Rule Breaking", "Pop Culture", "Eclecticism"],
    },
    skeuomorphic: {
      id: "skeuomorphic",
      name: "Skeuomorphism",
      description: "Realistic textures and depth.",
      yearRange: "2000s-2010s",
      primaryAttributes: ["Bevels", "Gradients", "Textures"],
    },
    fluid: {
      id: "fluid",
      name: "Fluid / Glass",
      description: "Modern, translucent, and motion-heavy.",
      yearRange: "2020s-Present",
      primaryAttributes: ["Blur", "Gradients", "Smoothing"],
    },
  };

  validateTheme(themeId: string): themeId is ThemeEra {
    return Object.keys(this.eras).includes(themeId);
  }

  getThemeMetadata(themeId: ThemeEra): ThemeMetadata {
    return this.eras[themeId];
  }

  getAllThemes(): ThemeMetadata[] {
    return Object.values(this.eras);
  }
}
