# Sprint 05 — Suggestion Chips UX Improvement

**Status:** Todo  
**Priority:** Medium  
**Estimated Effort:** 30 min

## Problem
The "TRY ASKING" label is tiny, faint, and easy to miss. The chips themselves are thin outlined buttons on a light background — they don't visually communicate "click me" to users. The entire chip section feels like an afterthought below the response.

## Acceptance Criteria
- [ ] Section label is replaced with a more inviting phrase, e.g. "Continue exploring →" or "Suggested follow-ups"
- [ ] Chips have a filled background (e.g., `bg-[var(--foreground)]/5`) instead of just a border
- [ ] Chips show a subtle hover state with a shadow lift or background fill change
- [ ] Each chip has a small directional arrow "→" or a relevant emoji prefix based on content type (🎨 for design, 🔊 for audio, 📐 for diagrams)
- [ ] Chips animate in with a staggered fade-in after the response finishes streaming
- [ ] The section has a small top margin so it doesn't feel attached to the message bubble

## Files to Modify
- `src/app/ChatUI.tsx` — `SuggestionChips` component

## Definition of Done
Chips are visually inviting, animated, and clearly distinguishable as interactive elements. Clicking still sends the suggestion message correctly.
