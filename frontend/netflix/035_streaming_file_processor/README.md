# N35. Streaming File Processor

**Difficulty:** Medium
**Topics:** Streams, Chunking, Transforms

---

## Description

Read input in fixed-size chunks, transform each chunk, and pipe the results into
a single output — the core of a Node Transform stream, modeled in memory.

## Examples

```ts
processInChunks('abcdef', 2, (c) => c.toUpperCase()); // 'ABCDEF'
```

## Constraints

- The last chunk may be smaller than `chunkSize`.
- Preserve chunk order in the output.
