# Sprint 03 — Table Theme Awareness

**Status:** Todo  
**Priority:** Medium  
**Estimated Effort:** 1 hour

## Problem
Rendered markdown tables use hardcoded grey borders and backgrounds instead of the active design theme's CSS variables. When in Bauhaus mode, tables should have 4px black borders and a red header accent — not the same grey as every other theme.

## Acceptance Criteria
- [ ] Table `<thead>` background uses `var(--accent-color)` with `var(--accent-foreground)` text
- [ ] Table outer container border uses `var(--border-color)` and `var(--border-width)` 
- [ ] Table `<td>` borders use `var(--border-color)`
- [ ] Table `border-radius` on outer wrapper uses `var(--border-radius)`
- [ ] Striped rows use `var(--surface)` and `var(--surface-muted)` alternately
- [ ] Verified in all 5 themes: Bauhaus (dramatic), Swiss (minimal), Postmodern (chaotic), Skeuomorphic (glossy), Fluid (clean)

## Files to Modify
- `src/app/ChatUI.tsx` — `flushTable()` JSX in `renderMarkdown`

## Definition of Done
Ask the AI to create a comparison table while in each of the 5 themes. Table visually matches the active design era.
