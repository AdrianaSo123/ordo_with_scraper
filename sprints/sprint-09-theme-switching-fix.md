# Sprint 09 — Theme Switching Fix

**Status:** Todo  
**Priority:** High  
**Estimated Effort:** 30 min

## Problem
Clicking "Show me the Bauhaus era →" fires a chat response and the AI calls `set_theme`, but the page background does not visually update. The theme CSS class is not being applied to the `<html>` element in the DOM after the tool call completes.

## Root Cause
The `parseUICommands` function looks for `__ui_command__:set_theme:bauhaus` in `tool_result` parts. If the MCP server returns the command in a different format or the theme class is not being set on `<html>`, the switch silently fails.

## Acceptance Criteria
- [ ] `ThemeProvider` correctly applies `theme-{name}` class to `<html>` element on every `setTheme()` call
- [ ] Clicking "Show me the Bauhaus era" chip triggers the Bauhaus visual theme (red accent, beige background, 4px black borders, sharp corners)
- [ ] Theme persists in `localStorage` so page refresh keeps the active theme
- [ ] A `ThemeIndicator` micro-pill appears somewhere in the chat after a theme change so the user knows it was applied
- [ ] All 5 themes switch cleanly with no flash of wrong theme

## Files to Modify
- `src/components/ThemeProvider.tsx` — Verify class is applied to `<html>` not just a wrapper div
- `src/app/ChatUI.tsx` — Verify `parseUICommands` is matching the correct format from the MCP tool result

## Definition of Done
Ask the AI to "switch to Bauhaus theme" — the page visually transforms immediately.
