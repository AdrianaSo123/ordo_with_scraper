# Sprint 01 — Input Bar Redesign

**Status:** Todo  
**Priority:** Critical  
**Estimated Effort:** 30 min

## Problem

The input bar at the bottom of the chat feels cramped with minimal padding and no visual separation from the chat content. It competes with browser chrome and doesn't feel like a premium command center.

## Acceptance Criteria

- [ ] Input bar has generous vertical padding (at minimum `py-5` on mobile, `py-6` on desktop)
- [ ] Input bar has a clear frosted-glass or elevated background that separates it from the message list
- [ ] The input field itself is taller (`py-4` minimum) with rounded-2xl corners
- [ ] The Send button is visually distinct and premium-feeling (gradient or solid accent)
- [ ] The "Core engine powered by Claude 3.5 Sonnet" footnote is styled subtly
- [ ] On mobile, extra bottom safe-area padding is applied (`pb-safe`)
- [ ] Placeholder text is helpful and contextual to the current conversation theme

## Files to Modify

- `src/app/ChatUI.tsx` — Input area section (bottom of JSX)
- `src/app/globals.css` — Any new utility classes needed

## Definition of Done

Input bar looks premium and spacious at http://localhost:3001. Verified that typing and submitting still works correctly after changes.
