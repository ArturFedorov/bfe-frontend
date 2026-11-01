# N26. File Watcher with Debounced Rebuild

**Difficulty:** Medium
**Topics:** Debounce, Timers, Tooling

---

## Description

Implement the debounce that a file watcher uses to coalesce rapid change events
into a single rebuild after a quiet period.

## Examples

```ts
const rebuild = debounce(runBuild, 200);
// rapid fs events -> runBuild fires once, 200ms after the last event
```

## Constraints

- Trailing-edge debounce: fire after `wait` ms of silence.
- Pass through the most recent arguments.
- Tests use Jest fake timers.
