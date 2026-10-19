# 068. Streaming Transcript

**Difficulty:** Medium
**Topics:** Streaming, AsyncIterable, AbortController, Incremental Rendering

---

## Scenario

On the annotation platform, when an annotator hesitates over a label the
"suggest label rationale" panel asks the assistant model to explain the
model-suggested label, and the explanation arrives as a token stream. The
first version replaced the whole paragraph on every chunk (the text flickered
as the panel re-laid-out), joined chunks with a space so a chunk that split a
word (`'Lab' + 'el'`) rendered as `Lab el` or lost characters, kept rendering
tokens into a panel the annotator had already navigated away from, and when
the model backend dropped mid-stream it showed an error that wiped the partial
rationale the QA analyst was already reading. Build the panel that consumes an
injected async stream, appends tokens without loss, lets the annotator stop
early, and never updates after it has been stopped or unmounted.

The stream is injected as `source: (signal: AbortSignal) => AsyncIterable<string>`
so the component is independent of the transport (fetch body, SSE, WebSocket)
and tests can drive chunks deterministically.

## Acceptance Criteria

- Starts consuming `source(signal)` on mount; while chunks are arriving an
  element with `role="status"` reads `Generating…`.
- Text accumulates by plain concatenation into an element with
  `data-testid="transcript"`: chunks `['Lab', 'el be', 'cause…']` render
  exactly `Label because…` — no separators inserted, no characters lost,
  previous text is never replaced.
- When the iterable completes normally the status reads `Done` and
  `onComplete` is called exactly once with the full accumulated text.
- A `Stop` button aborts the signal passed to `source`
  (`signal.aborted === true`), sets the status to `Stopped`, keeps the partial
  text on screen and does not call `onComplete`. Chunks the source yields
  after the stop are ignored even if the source does not honour the signal.
- If the iterable throws mid-stream, an element with `role="alert"` shows the
  error's message, the status reads `Failed`, and the partial text is retained.
- Unmount aborts the signal; chunks arriving afterwards cause no state updates
  and no `console.error`.
- The `Stop` button is disabled (or removed) once the stream is no longer
  streaming — done, stopped or failed.
- A11y: live progress via `role="status"`, failures via `role="alert"`.

## Example

```tsx
<StreamingTranscript
  source={(signal) => rationaleApi.stream({ labelId, signal })}
  onComplete={(text) => saveRationale(labelId, text)}
/>
// chunks: 'The span ' → 'mentions a ' → 'dosage, ' → 'so MEDICATION fits.'
// transcript grows in place; status 'Generating…' → 'Done'; onComplete once
// Stop mid-way → signal aborted, status 'Stopped', text kept, no onComplete
```

## Target

30–40 minutes. Senior signals: one `AbortController` per mount owned by the
effect, a `for await…of` loop that checks `signal.aborted` after every
`await`, accumulation in a local variable (not `setText(prev => prev + chunk)`
racing with reset), cleanup that aborts instead of a boolean flag, and
`onComplete` read through a ref so a new callback identity does not restart
the stream.

## Interviewer follow-up

The real backend speaks Server-Sent Events over `fetch` and you receive raw
`Uint8Array` chunks from `response.body.getReader()`. A single SSE frame
(`data: {...}\n\n`) can be split across two chunks, and one chunk can contain
several frames. How would you write the byte-to-frame parser (think
`TextDecoder` with `stream: true` and a carry-over buffer), and how would you
batch the resulting tokens per animation frame so a fast model emitting
hundreds of tokens a second does not force hundreds of React re-renders?
