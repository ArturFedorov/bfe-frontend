# 075. Reconnecting Event Source

**Difficulty:** Hard
**Estimated time:** 60 min
**Topics:** EventSource, Exponential Backoff, Resume with Last-Event-ID, Deduplication, Page Visibility, Cleanup

---

## Scenario

QA analysts keep the "agent run" page open for hours while a pre-annotation
agent streams progress events over `EventSource`. The first version relied on
the browser's built-in retry, which reconnects every 3 seconds forever and
hammered the backend during an outage; after a reconnect the server replayed
events since the last id and the timeline showed every step twice; and when
the analyst switched tabs the page kept reconnecting in the background,
burning the team's connection quota. Build `useEventStream(url, options?)`:
a hook that owns one `EventSource` at a time, backs off exponentially with
jitter, resumes from the last seen id, drops replayed duplicates, waits while
the tab is hidden, and tears everything down on `close()` or unmount.

Tests install a `FakeEventSource` on `globalThis` (see `_helpers`), so the
hook must use the global `EventSource` constructor, not an injected factory.

## Requirements

1. `useEventStream(url, options?)` returns
   `{ status, events, lastEventId, close }` with
   `status: 'connecting' | 'open' | 'reconnecting' | 'closed'`,
   `events: StreamEvent[]` (`{ id: string | null; type: string; data: string }`,
   arrival order), `lastEventId: string | null`, `close(): void`.
2. On mount: construct `new EventSource(url)` once, status `connecting`.
   `open` → status `open` and the backoff attempt counter resets to 0.
3. Every `message` event (and every type listed in `options.eventTypes`) is
   appended to `events`. `id` is the event's `lastEventId`, or `null` when it
   is empty. A non-null id updates `lastEventId`.
4. Dedupe by id: an event whose id has already been seen on this hook
   instance is dropped (not appended, `lastEventId` unchanged). Events with
   `id === null` are never deduped.
5. On `error`: call `close()` on the source, set status `reconnecting`, and
   schedule a reconnect after
   `delay = min(maxMs, baseMs * 2^attempt + jitter() * baseMs)` where
   `attempt` is 0 for the first retry after a successful open and increments
   per consecutive failure. Options: `baseMs` (default 1000), `maxMs`
   (default 30000), `jitter` (default `Math.random`, returns `[0, 1)`).
6. When the timer fires: construct a new `EventSource` and set status
   `connecting`. If `lastEventId` is non-null the URL carries it as a query
   parameter `lastEventId=<encodeURIComponent(id)>` (appended with `?` or `&`
   depending on whether the URL already has a query). The first connection
   never carries the parameter.
7. A superseded source (one the hook has already closed) must be inert: its
   late `message` events are ignored and a second `error` from it does not
   schedule another reconnect.
8. Page visibility: if `document.visibilityState === 'hidden'` when an error
   occurs, do not schedule a reconnect (status stays `reconnecting`). If the
   tab becomes hidden while a reconnect timer is pending, cancel the timer.
   On `visibilitychange` back to `visible` while waiting, reconnect
   immediately (status `connecting`, URL carries `lastEventId`). An open
   connection is **not** closed when the tab hides.
9. `close()`: closes the current source, cancels any pending timer, sets
   status `closed`, and makes the hook inert — later errors, visibility
   changes and timers create no connection. `close` identity is stable.
10. Unmount behaves like `close()` without a state update: the source is
    closed and a pending reconnect timer is cancelled (no new `EventSource`
    is constructed afterwards).

## Acceptance Criteria

- [ ] Mount constructs exactly one `EventSource` with the given `url`; status `connecting`.
- [ ] `open()` → status `open`.
- [ ] `emit('a', { lastEventId: '1' })` → `events = [{ id: '1', type: 'message', data: 'a' }]`, `lastEventId = '1'`.
- [ ] An event with empty `lastEventId` has `id: null` and leaves `lastEventId` unchanged.
- [ ] `eventTypes: ['step']` receives named `step` events with `type: 'step'`.
- [ ] `error()` → source `readyState` is CLOSED, status `reconnecting`, no new source before `baseMs`, a new one at exactly `baseMs`, status `connecting`.
- [ ] With `jitter: () => 0`, `baseMs: 1000`, `maxMs: 5000`: consecutive failures reconnect after 1000, 2000, 4000, 5000, 5000.
- [ ] With `jitter: () => 0.5`: first reconnect after 1500 ms.
- [ ] After a successful `open`, the next failure waits `baseMs` again (counter reset).
- [ ] Reconnect URL is `/runs/42/events?lastEventId=7`; with an existing query it is `/events?run=42&lastEventId=7`; first URL has no parameter.
- [ ] A replayed id after reconnect is dropped; two events without id are both kept.
- [ ] Late `message` from a superseded source is ignored; a second `error` from it creates no extra source.
- [ ] Error while hidden: no source after 60 s; `visibilitychange` to visible → new source immediately with `lastEventId`.
- [ ] Hidden during the wait cancels the timer; visible again reconnects.
- [ ] `close()` → status `closed`, source CLOSED, pending timer cancelled, visible does nothing, `close` identity stable across renders.
- [ ] Unmount during the reconnect wait → no new source after timers advance; unmount while open closes the source.

## Baseline a11y

The hook has no DOM, but it is the data source for a live region. Expose
`status` so the consuming component can render it in a `role="status"`
element with text that changes between `Connecting`, `Live`, `Reconnecting`
and `Disconnected`, and never flash status text more often than once per
state change.

## Constraints

- No third-party libraries. Use the global `EventSource`, `setTimeout`,
  `document.visibilityState` and `visibilitychange`.
- Exactly one `EventSource` alive at a time. Never leave a listener attached
  to a source you have closed.
- `jitter` may be a new function identity on every render; it must not
  reconnect or re-subscribe when it changes. `url` is fixed for the life of
  the hook (changing it is a follow-up, not a requirement).

## Interviewer follow-ups

- The `EventSource` API cannot set headers, so `Last-Event-ID` goes in the
  query string. How would you swap the transport for `fetch` + the 074
  parser to send real headers while keeping this hook's public API?
- The dedupe set grows without bound on a run that emits a million events.
  How would you bound it (ring buffer, monotonic ids, server-side cursor)?
- The server can send `retry:` hints. How would you honour them in the
  backoff formula without letting a hostile hint disable backoff?
- Two components mount the hook for the same `url`. How would you share one
  connection (module-level registry, `useSyncExternalStore`)?

## Say out loud

- State shape first: React state `{ status, events, lastEventId }`; a
  mutable connection record in a ref `{ source, timer, attempt, seenIds,
  closed }` because timers and listeners must read the latest values without
  re-running the effect.
- Name the hazard: listeners on an old `EventSource` firing after you created
  a new one (identity check `source === current`), and a timer firing after
  unmount/close (clear it in cleanup and guard with `closed`).
- Ask one data-shape question: "Are ids monotonically increasing integers, or
  opaque strings? That decides whether dedupe can be a `lastId` comparison or
  needs a set."
- Ask one failure question: "After N consecutive failures should we give up
  and surface `closed` with an error, or back off at `maxMs` forever?"
- First test you'd write: mount constructs one `EventSource` with the url and
  reports `connecting`.
