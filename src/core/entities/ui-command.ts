export const UI_COMMAND_TYPE = {
  SET_THEME: "set_theme",
  NAVIGATE: "navigate",
} as const;

export type UICommand =
  | { type: typeof UI_COMMAND_TYPE.SET_THEME; theme: string }
  | { type: typeof UI_COMMAND_TYPE.NAVIGATE; path: string };
