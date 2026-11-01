# N16. Module Resolution Tracer

**Difficulty:** Medium
**Topics:** Module Resolution, Node Internals

---

## Description

Trace the full resolution path Node would take for a relative `require`,
returning each candidate it tries in order up to the resolved file.

## Examples

```ts
traceResolution(new Set(['/app/util.js']), '/app', './util');
// ['/app/util', '/app/util.js']
```

## Constraints

- Candidate order: exact, `.js`, `.json`, then `<dir>/index.js`.
- Stop at the first candidate that exists.
