# Sprint 08 — Message Timestamps

**Status:** Todo  
**Priority:** Low  
**Estimated Effort:** 20 min

## Problem
All messages look identical weight with no temporal context. Users have no idea when messages were sent, making it hard to reference prior conversations or understand the flow of a long session.

## Acceptance Criteria
- [ ] Each message shows a relative timestamp (e.g., "Just now", "2 min ago") displayed subtly below or beside the bubble
- [ ] Timestamps use a very small font size (`text-[10px]`) and low opacity (`opacity-40`)
- [ ] User messages show timestamp on the right, assistant messages on the left
- [ ] Timestamps update live (using `setInterval` or a `useEffect` to refresh every 60 seconds)
- [ ] Show absolute time on hover (e.g., tooltip showing "3:42 PM")
- [ ] Does not break the streaming state (timestamps only appear after message is complete)
- [ ] Chat sessions from a previous page load still have correct relative timestamps

## Files to Modify
- `src/hooks/useChatStream.ts` — Add `timestamp: Date` field to Message type
- `src/app/ChatUI.tsx` — Add timestamp display to `UserBubble` and `AssistantBubble`

## Definition of Done
Every completed message in the chat shows a subtle relative timestamp. Hovering shows exact time. Layout is not disrupted.
