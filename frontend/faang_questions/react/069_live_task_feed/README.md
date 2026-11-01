# 069. Live Task Feed

**Difficulty:** Hard
**Topics:** Event-Driven State, useReducer, WebSocket Reconnect, Idempotency, Ordering

---

## Scenario

The QA dashboard of an ML data-annotation platform shows annotation tasks
updating live: reviewers approve and reject, the pipeline re-queues, and every
change streams to the dashboard over a WebSocket. The first version was a
thin `onmessage → setTasks([...tasks, task])`. In production it appended
duplicate rows after every reconnect, applied stale updates over newer ones
when the server replayed events, reconnected in a tight loop during an outage
(thousands of handshakes per minute), and leaked open sockets every time the
dashboard route unmounted. Build the feed so that the list is a correct,
idempotent projection of the event stream and the connection lifecycle is
owned by the component.

The transport is injected as `connect(since, handlers)`: it opens a connection
and returns `{ close }`. `since` is the highest event `seq` you have applied
(0 on the first connect) so the server can replay what you missed. Every
task carries a monotonically increasing `version`; every event carries a
stream-wide `seq`.

## Acceptance Criteria

- Connects on mount by calling `connect(0, handlers)`; renders `Live` with
  `role="status"` once `connect()` has returned.
- Renders a `role="list"` named `Tasks` with one `role="listitem"` per task
  showing the task title and status, sorted by title.
- `task_upserted` adds or updates a task. An upsert whose `version` is less
  than or equal to the known version for that id is ignored (stale replay);
  a later, higher version wins.
- A duplicated event (same `seq` delivered twice, e.g. during a replay) is
  applied exactly once — no duplicate list items, no version regression.
- `task_removed` removes the task only if its `version` is greater than or
  equal to the known version; a stale upsert replayed after a removal must
  not resurrect the task.
- On `onClose` or `onError`: renders `Reconnecting…` with `role="alert"`, then
  reconnects after `reconnectMs` (default 1000), doubling per consecutive
  failure (× 2, × 4, …) and capped at `maxReconnectMs` (default 8000). Each
  reconnect passes `since` = the highest `seq` applied so far.
- The alert clears as soon as `connect()` returns; a reconnect that delivers
  at least one event is considered successful and resets the delay back to
  `reconnectMs`.
- Events, closes and errors arriving on a connection after it has been
  superseded (a newer connection exists) or after unmount are ignored.
- Unmount closes the active connection and cancels any pending reconnect
  timer: no further `connect` calls, no state updates.

## Example

```tsx
<LiveTaskFeed
  connect={(since, handlers) => {
    const ws = new WebSocket(`wss://qa.example/feed?since=${since}`);
    ws.onmessage = (m) => handlers.onEvent(JSON.parse(m.data));
    ws.onclose = handlers.onClose;
    ws.onerror = () => handlers.onError(new Error('socket error'));
    return { close: () => ws.close() };
  }}
  reconnectMs={1000}
  maxReconnectMs={8000}
/>
// seq 1 upsert t1 v1 → seq 2 upsert t1 v2 → drop → reconnect(since=2)
// → server replays seq 2 (ignored, same version) → seq 3 removed t1 v2 → row gone
```

## Target

45–60 minutes. Senior signals: a pure reducer that decides by `version` (not
by arrival order) and keeps tombstones for removed ids; `since` tracked in a
ref so the reconnect closure reads the latest value; a generation counter (or
per-connection flag) that makes handlers from a superseded socket inert; and
a single cleanup that both closes the socket and clears the timer.

## Interviewer follow-up

- The server cannot replay from an arbitrary `since` (it only keeps the last
  minute of events). The protocol becomes snapshot + delta: on connect you
  receive a full `snapshot` event, then deltas. What changes in your reducer
  and in the reconnect path, and how do you avoid flashing an empty list
  while the snapshot is loading?
- After a long outage the replay delivers 500 events in one burst. Each
  `dispatch` schedules a render. How would you batch events (microtask /
  `requestAnimationFrame` queue, or a `events_batch` action) so the UI stays
  responsive, and what does that do to your `since` bookkeeping if the
  connection drops mid-batch?
