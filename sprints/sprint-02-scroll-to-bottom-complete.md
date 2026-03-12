# Sprint 02 — Scroll to Bottom Button

**Status:** Todo  
**Priority:** High  
**Estimated Effort:** 30 min

## Problem

Long conversations have no way to jump back to the latest message. Users have no scroll progress indicator or one-click "jump to bottom" affordance.

## Acceptance Criteria

- [ ] A floating "↓" button appears when the user has scrolled up more than ~200px from the bottom
- [ ] Clicking the button smooth-scrolls the view back to the latest message
- [ ] The button disappears automatically once the user is near the bottom
- [ ] Button has a subtle unread message badge (e.g., shows "1 new" when AI has replied while user is scrolled up)
- [ ] Positioned bottom-right, above the input bar (not overlapping it)
- [ ] Animates in/out with a fade + scale transition

## Files to Modify

- `src/app/ChatUI.tsx` — Add scroll position tracking state + floating button JSX

## Definition of Done

User can scroll up in a long conversation and see the floating button. Clicking it returns to the bottom. Button disappears when already at bottom.
