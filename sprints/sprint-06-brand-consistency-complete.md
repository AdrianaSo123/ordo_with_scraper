# Sprint 06 — Brand Consistency (Remove Emoji Overuse)

**Status:** Todo  
**Priority:** Low  
**Estimated Effort:** 20 min

## Problem
The 📚 emoji appears in the navbar brand, the assistant message avatar, and the empty welcome state. This dilutes meaning and makes the product feel unresolved. A real product needs a consistent, singular brand mark.

## Acceptance Criteria
- [ ] Navbar brand (`PDA`) uses a designed SVG icon or a styled text mark instead of 📚
- [ ] Assistant message avatar uses a consistent styled element (monogram, geometric mark, or brand icon) — not an emoji
- [ ] Empty state welcome uses an illustrated icon or a single brand-consistent graphic
- [ ] All three usages feel like they belong to the same design language
- [ ] The brand mark should work in both light and dark mode (using CSS variables for color)

## Files to Modify
- `src/components/SiteNav.tsx` — Brand mark
- `src/app/ChatUI.tsx` — Assistant avatar, empty state

## Definition of Done
No raw emoji used as brand/avatar elements. Consistent visual identity across all three usages.
