# N29. Interactive Prompt System

**Difficulty:** Medium
**Topics:** State Machines, CLI, stdin

---

## Description

Implement the pure logic behind `confirm()` / `select()` prompts: interpreting a
confirm answer and reducing arrow-key navigation over a list. (Wiring raw stdin
is the I/O layer on top.)

## Examples

```ts
parseConfirm('', true);                 // true
applyKey({ index: 0, length: 3, done: false }, 'down'); // index 1
```

## Constraints

- `confirm`: empty input returns the default; accept y/yes/n/no case-insensitively.
- `select`: arrow keys wrap around; enter sets `done`.
