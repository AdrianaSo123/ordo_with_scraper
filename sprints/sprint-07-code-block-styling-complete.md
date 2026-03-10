# Sprint 07 — Code Block Styling

**Status:** Todo  
**Priority:** High  
**Estimated Effort:** 45 min

## Problem
When Claude responds with fenced code blocks (```language ... ```), they render as raw text rather than styled code blocks. There is no syntax-highlighted, dark-background code container with a copy button.

## Acceptance Criteria
- [ ] Fenced code blocks (``` ``` ```) are detected and rendered as `<pre><code>` elements
- [ ] Language label is shown in the top-left of the code block (e.g., "typescript", "bash")
- [ ] Code block has a dark background (`#1e1e2e` or similar) regardless of the active theme
- [ ] Monospace font is applied (`font-mono`)
- [ ] Horizontal scrolling is enabled for long lines (`overflow-x: auto`)
- [ ] A "Copy" button in the top-right of the block copies the code to clipboard
- [ ] Copy button changes to "Copied ✓" for 2 seconds after clicking
- [ ] Code blocks do NOT break inside inline `` `code` `` spans (single backtick rendering should remain unchanged)

## Files to Modify
- `src/app/ChatUI.tsx` — Add fenced code block detection to `renderMarkdown`, add `CodeBlock` sub-component
- The `renderSpan` inline code handler can remain as-is for single backticks

## Definition of Done
Ask the AI to "show me a TypeScript example of a React component." The output appears in a dark-background code block with a copy button and language label. Copying works correctly.
