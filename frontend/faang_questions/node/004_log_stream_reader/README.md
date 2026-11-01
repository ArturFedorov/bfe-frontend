# 004. Log Stream Reader

**Difficulty:** Medium
**Topics:** Streams, Backpressure-Friendly Iteration, Chunk-Boundary Parsing

---

## Scenario

Partner delivery logs land as multi-gigabyte files — one JSON event per line.
The current "reader" does `readFile(...).toString().split('\n')` and OOMs the
report worker on anything over a couple of GB. Rebuild it as a streaming line
splitter: consume the source chunk by chunk, emit complete lines as they
become available, and hold **at most one partial line** in memory at any time.

## Requirements

- `splitLines(source)` is an async generator over any
  `AsyncIterable<Buffer | string>` (a Node `Readable` qualifies) that yields
  one string per line.
- Lines end with `\n` or `\r\n`; the terminator is stripped from the yield.
- Chunk boundaries are arbitrary: a line may be split mid-word across chunks,
  a single chunk may contain many lines, and a `\r\n` may be split with `\r`
  at the end of one chunk and `\n` at the start of the next — all must
  reassemble correctly.
- A trailing line without a final newline is still yielded at end of stream;
  a final `\n` does NOT produce an extra empty line.
- Empty lines between terminators (`'a\n\nb'`) ARE yielded as `''`.
- A single huge line spread over many chunks is accumulated and yielded whole.
- **Memory constraint:** buffer only the current unterminated tail — never
  concatenate the whole stream. (The tests feed chunked input via
  `Readable.from`; the constraint is enforced by code review + the huge-line
  test staying incremental.)
- Bonus surface: `collectLines(source)` — convenience that drains the
  generator into a `string[]` (used heavily by the tests).

## Example

```ts
const source = Readable.from(['{"id":1}\n{"id', ':2}\r\n{"id:', '3}']);
for await (const line of splitLines(source)) {
  console.log(line);
}
// {"id":1}
// {"id":2}
// {"id:3}
```

## Target

20–25 minutes. The senior signals: holding back a trailing `\r` until the next
chunk decides whether it is a bare `\r` or half a `\r\n`, and yielding the
unterminated tail exactly once at EOF.

## Interviewer follow-up

The consumer of `splitLines` awaits a slow database insert per line. What
stops the file source from flooding memory while it waits — where does
backpressure live in the `for await…of` chain?
