# N28. Progress Reporter

**Difficulty:** Easy
**Topics:** Strings, CLI, Formatting

---

## Description

Render a CLI progress bar string for long-running operations (a spinner + ETA
are natural extensions).

## Examples

```ts
renderBar(3, 10, 10); // '[###-------] 30%'
```

## Constraints

- Clamp `current` to `[0, total]`.
- `width` filled/empty cells; percentage is rounded.
