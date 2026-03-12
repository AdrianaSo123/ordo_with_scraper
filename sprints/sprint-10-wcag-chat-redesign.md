# Sprint 10 — Full Chat Redesign (Spacing · Aesthetics · WCAG)

**Status:** Todo  
**Priority:** Critical  
**Estimated Effort:** 2–3 hours

## Problem

The chat UI has accumulated incremental fixes but lacks a cohesive, intentional spatial system. It does not meet WCAG 2.1 AA standards in several areas: contrast ratios, focus rings, touch target sizing, and semantic structure.

## WCAG Violations to Fix

### 1.4.3 Contrast (AA) — Minimum 4.5:1 for normal text

- Timestamps ("30s ago") at `opacity-35` on light bg = fails
- "Continue exploring" label at `opacity-40` = fails
- Placeholder text at `opacity-40` = may fail on some themes
- Tool call labels at `opacity-90` — verify

### 2.4.7 Focus Visible

- Input textarea has no visible focus ring when using keyboard
- Suggestion chips have no `:focus-visible` ring styling
- Send button has no keyboard focus indicator

### 2.5.5 Target Size (AA) — Minimum 24×24px, recommended 44×44px

- Suggestion chips py-1.5 = ~30px tall — borderline
- Copy button on code blocks is very small
- Scroll-to-bottom button — verify

### 1.3.1 Info and Relationships (semantic HTML)  

- Chat message list should be `<ol role="list">` not bare divs
- User and assistant messages need `aria-label` to distinguish sender
- Input area needs a visible `<label>` or at minimum `aria-labelledby`

### 4.1.2 Name, Role, Value

- Send button must clarify the action in its disabled state (`aria-label`)
- Scroll button needs `aria-label` — currently has it ✓
- Role switcher dropdown needs `aria-expanded` on trigger

## Spacing System to Implement (8pt Grid)

All spacing should be multiples of 4px/8px:

- Message bubble vertical padding: 12px / 16px
- Gap between messages: 16px (user→assistant) / 8px (same sender)
- Max content width: 680px (assistant) / 640px (user — narrower reads better)
- Input area: 16px padding all sides, 8px inner gap
- Avatar size: 32px × 32px (currently 28px — too small)

## Aesthetic Improvements

- Message bubbles need a more distinct visual separation: user = filled accent, assistant = translucent white with subtle shadow
- Assistant bubble should have no border — just elevation shadow
- Add a subtle gradient fade at the top of the message list (masks the hard edge)
- Chips: increase to 36px min-height for touch targets
- The welcome state icon should scale on viewport: `w-16 h-16 sm:w-20 sm:h-20`
- Typography: use `text-base` (16px) not `text-sm` (14px) for message bubbles — readability
- Line height: `leading-7` for longer AI responses (1.75 rhythm)

## Files to Modify

- `src/app/ChatUI.tsx` — All bubble components, input area, welcome state, ARIA attributes
- `src/app/globals.css` — Focus ring utilities, chat-specific CSS

## Definition of Done

- Run automated Axe accessibility check: 0 critical, 0 serious violations
- All interactive elements have visible keyboard focus rings
- No opacity values below 0.6 on text (contrast passes AA)
- Chat bubbles use 8pt grid throughout, verified by GridInspector
- Looks premium and spacious — not cramped
