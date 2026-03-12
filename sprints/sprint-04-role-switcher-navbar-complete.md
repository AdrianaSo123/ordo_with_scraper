# Sprint 04 — Move Role Switcher into Navbar

**Status:** Todo  
**Priority:** Medium  
**Estimated Effort:** 20 min

## Problem

The `ROLE Anonymous` pill appears as a fixed bottom-right overlay that sits on top of content and reads as a debug tool. It should be integrated cleanly into the primary navbar.

## Acceptance Criteria

- [ ] Role indicator is moved from the fixed footer position into `SiteNav.tsx`
- [ ] Appears as a subtle pill/badge between the nav links and the accessibility icon
- [ ] Shows current role with a colored dot indicator (Anonymous = grey, Authenticated = green, Staff = blue, Admin = purple)
- [ ] Clicking it opens the role switcher dropdown inline (matching the style of AccessibilityPanel)
- [ ] Fixed bottom-right debug overlay is completely removed
- [ ] Role switcher dropdown closes on outside click

## Files to Modify

- `src/components/SiteNav.tsx` — Add role indicator/switcher
- `src/components/RoleSwitcher.tsx` (or wherever the current one lives) — Refactor to navbar-compatible component
- Remove the fixed footer overlay

## Definition of Done

No fixed position debug overlay visible. Role is clearly shown in navbar. Clicking it still allows switching between roles.
