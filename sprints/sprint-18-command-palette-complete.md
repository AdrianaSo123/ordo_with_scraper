# Sprint 18: Command Palette (Cmd + K)

## Goal

Implement a centralized search and command interface for high-speed navigation and control.

## Features

- **Cmd+K Trigger**: Global hotkey to open a fuzzy-search modal.
- **Action Index**:
  - Index all books and chapters for jumping.
  - Index all theme commands.
  - Index all navigation routes.
- **Dynamic Preview**: Show what a theme or chapter looks like before navigating.

## Success Criteria

- `Cmd + K` opens a modal from any page.
- Typing "Bauhaus" shows the Bauhaus theme and all its chapters.
- Selecting an item with `Enter` executes the action.
