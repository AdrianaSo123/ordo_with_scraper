# Sprint 17: Slash Commands & Keyboard Shortcuts

## Goal

Implement a keyboard-first interaction layer to allow users to execute commands without leaving the input field.

## Features

- **Slash Commands Parser**: Support `/theme [era]`, `/nav [page]`, `/reset`, and `/summarize`.
- **Keyboard Shortcuts**:
  - `Cmd + Enter`: Submit multi-line messages.
  - `Up Arrow`: Edit the last sent message.
  - `Cmd + 1...5`: Quick theme switching.
  - `Esc`: Stop generating/Cancel.

## Success Criteria

- Typing `/theme swiss` immediately transformations the UI.
- Pressing `Up Arrow` in an empty textarea populates it with the previous message for editing.
- `Cmd + Enter` works for submission even when the input has multiple lines.
