# 074. SSE Stream Parser

**Difficulty:** Hard
**Estimated time:** 60 min
**Topics:** Server-Sent Events, ReadableStream, TextDecoder, Async Generators, AbortSignal

---

## Scenario

On the ML data-annotation platform the "suggest label rationale" model streams
its answer over `fetch` as Server-Sent Events, and `response.body` hands you
raw `Uint8Array` chunks. The first parser called `TextDecoder.decode()` per
chunk, so a chunk boundary inside a multibyte character (`é`, an emoji in the
rationale) produced replacement characters; it split on `\n` only, so a
backend that emits `\r\n` left a stray `\r` at the end of every `data` value;
and a `\r\n` pair split across two chunks dispatched the same event twice,
duplicating tokens in the annotator's transcript. Build the byte-to-event
parser the streaming panel (068) and the reconnecting hook (075) will sit on.

## Requirements

1. `parseSSE(stream, options?)` returns an `AsyncIterable<SSEMessage>` where
   `SSEMessage = { event: string; data: string; id: string | null; retry: number | null }`.
2. Bytes are decoded with `TextDecoder` in streaming mode: a multibyte UTF-8
   character split across two chunks decodes correctly.
3. Line terminators are `\r\n`, `\n` or a lone `\r`. A `\r` at the end of one
   chunk followed by `\n` at the start of the next is a single terminator.
   Lines can be split anywhere between chunks and one chunk can hold several
   complete frames.
4. Field parsing follows the WHATWG EventSource spec: the field name is the
   text before the first `:`; the value is the text after it with exactly one
   leading space removed if present (`data:  x` → `" x"`, `data:x` → `"x"`).
   A line with no colon is a field with an empty value (`data` → data `""`).
   Lines starting with `:` are comments and are ignored. Unknown fields are
   ignored.
5. `data:` lines accumulate; multiple `data:` lines in one block are joined
   with `\n`. `event:` sets the event type for the block (default `message`).
6. A blank line dispatches the block. A block with no `data` line is **not**
   dispatched, but still resets the event type buffer.
7. `id:` sets the Last-Event-ID, which persists across subsequent messages
   until another `id:` line changes it. An `id:` line with an empty value
   resets it to `null`.
8. `retry:` with a value that is all ASCII digits sets `retry` to that integer
   on the dispatched message; any other value is ignored. `retry` is per block
   (`null` when the block had no valid `retry:` line).
9. At end of stream, an incomplete block (no trailing blank line) is discarded.
10. `options.signal`: when aborted, the parser cancels the reader, releases the
    reader lock (`stream.locked === false`) and the iteration completes without
    yielding further messages and without throwing. A signal that is already
    aborted yields nothing and never locks the stream.
11. The reader lock is released when the consumer stops early (`break` inside
    `for await`) and when the stream errors (the error propagates to the
    consumer).
12. Messages are yielded as soon as their blank line arrives — the parser must
    not wait for the stream to close.

## Acceptance Criteria

- [ ] One frame `data: hello\n\n` yields `{ event: 'message', data: 'hello', id: null, retry: null }`.
- [ ] Several frames in one chunk yield one message each, in order.
- [ ] `event: suggestion` produces `event === 'suggestion'`; the next block without `event:` is `message` again.
- [ ] `data:  two spaces` yields `" two spaces"`; `data:nospace` yields `"nospace"`; bare `data` yields `""`.
- [ ] Comment lines and unknown fields never appear in output and never dispatch.
- [ ] Two `data:` lines yield `"line one\nline two"`.
- [ ] `event: ping\n\n` (no data) is not dispatched and does not leak `ping` into the next message.
- [ ] `id: 7` persists to a later message without `id:`; `id:` (empty) resets to `null`.
- [ ] `retry: 5000` → `5000`; `retry: soon` → `null`.
- [ ] A frame split mid-line across three chunks yields exactly one correct message.
- [ ] `data: héllo` split inside `é` (and an emoji split inside its 4 bytes) decodes correctly.
- [ ] `data: a\r` + `\ndata: b\r\n\r\n` yields exactly one message `"a\nb"`.
- [ ] Lone `\r` terminators work.
- [ ] Trailing incomplete block at EOF is discarded.
- [ ] With a controllable stream, the first message resolves before `end()` is called.
- [ ] Abort mid-stream: pending `next()` resolves `done: true`, `stream.locked` is `false`.
- [ ] Pre-aborted signal: no messages, `stream.locked` stays `false`.
- [ ] `break` out of `for await` releases the lock.
- [ ] Stream error rejects the iteration and releases the lock.

## Baseline a11y

This is a pure data module with no DOM. The consuming UI (068/076) is
responsible for announcing progress via `role="status"` and failures via
`role="alert"`; this parser must make that possible by surfacing stream errors
to the consumer (never swallowing them) and by completing cleanly on abort so
the UI can show "Stopped" rather than an error.

## Constraints

- No third-party libraries. `ReadableStream`, `TextDecoder` and
  `AbortSignal` from the platform only.
- Implement as an `async function*` or a hand-written `AsyncIterable`; do not
  buffer the whole body before yielding.
- O(n) in bytes; do not re-scan the whole buffer on every chunk.

## Interviewer follow-ups

- The spec says `retry:` is connection-level state (it sets the reconnection
  time even in a block that is never dispatched). How would you surface a
  retry hint from a data-less block to the reconnecting layer?
- Per spec, an `id` containing a NUL character must be ignored. Where would
  that check go and how would you test it?
- A hostile or buggy backend never sends a blank line and streams megabytes of
  `data:`. How do you bound memory?
- How would you layer this under 075 (`useEventStream`) so the hook works
  over `fetch` + this parser instead of the `EventSource` API, gaining
  custom headers (`Authorization`, `Last-Event-ID`)?

## Say out loud

- State shape first: `buffer: string`, `dataLines: string[]`,
  `eventType: string`, `lastEventId: string | null`, `retry: number | null`,
  plus the `TextDecoder` instance (it is the stateful thing across chunks).
- Name the hazard: a `\r` at the end of a chunk must be held back until the
  next chunk reveals whether a `\n` follows; the reader lock must be released
  in `finally` for abort, break and error paths alike.
- Ask one data-shape question: "Can `data:` be JSON spread across lines, or
  is each `data:` line a complete token?"
- Ask one failure question: "On abort, should the iterator complete quietly or
  reject with an `AbortError`? Who shows the 'Stopped' state?"
- First test you'd write: one chunk, one frame, `data: hello\n\n` yields one
  default `message`.
