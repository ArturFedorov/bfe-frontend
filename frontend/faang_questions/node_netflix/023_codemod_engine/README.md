# N23. Codemod Engine

**Difficulty:** Hard
**Topics:** Transforms, Error Handling, Batch Processing

---

## Description

Apply an AST/string transform across many files, reporting which changed, which
stayed the same, and which errored — without aborting the whole run on a single
failure.

## Examples

```ts
runCodemod(files, transform);
// { changed: [...], unchanged: [...], errors: [{ path, message }] }
```

## Constraints

- A file is `changed` only if the transform output differs from the input.
- Capture per-file errors and continue.
