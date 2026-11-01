# 073. Agent Run Timeline

**Difficulty:** Hard
**Topics:** Agentic UI, Event Streams, useReducer, Long-Running Tasks, Cancellation, Retry

---

## Scenario

On the ML data-annotation platform, QA analysts can trigger a "pre-annotate
batch" agent that runs a multi-step pipeline — fetch items, call model,
validate, write suggestions — and streams progress events while it works.
Analysts watch the run live to decide whether the suggestions are worth
reviewing or the batch should be re-queued.

The first version rendered a single spinner for four minutes with no sign of
which step was running; it could not be cancelled, so a bad model config
burned the full GPU budget; when the validate step failed the whole log
vanished, leaving nothing to debug from; and after Retry the timeline showed
events from the old run interleaved with the new one.

Build the timeline that consumes the event stream, keeps a per-step log,
cancels cleanly, and retries without ghosts. This is the capstone for the
async track: it combines streaming consumption (068), an event-sourced
reducer (069), and terminal-state handling (022).

The stream arrives as an injected `run(signal): AsyncIterable<RunEvent>` so
tests can drive it deterministically (jsdom has no `ReadableStream`); treat it
exactly like a `fetch` body decoded to events.

## Acceptance Criteria

- Starts the run on mount by calling `run(signal)` once. `role="status"`
  shows `Running` and an elapsed counter `Elapsed: Ns` that ticks every
  second and stops ticking once the run is terminal.
- `role="list"` named `Steps` renders one `role="listitem"` per
  `step_started` event, in arrival order, showing the step name and its
  status text (`running` / `ok` / `error`).
- `step_output` chunks append to that step's output — exact concatenation,
  rendered in a `<pre>` inside the item. Output for an unknown `stepId` is
  ignored without crashing.
- `step_finished` updates the step's status and renders `message` when
  present (e.g. `Validation failed: 3 items`).
- `run_finished` sets the overall status to `Succeeded` / `Failed`; the
  Cancel button disappears.
- A Cancel button (`name: 'Cancel'`) aborts the signal, sets status
  `Cancelled`, keeps every step and chunk received so far, and ignores any
  event the iterable yields after the abort.
- If the iterable throws, the overall status is `Failed` and `role="alert"`
  shows the error message; steps are retained.
- After `Failed` or `Cancelled`, a Retry button (`name: 'Retry'`) appears.
  Clicking it clears the steps and the alert, resets the clock, and calls
  `run` again with a new, non-aborted signal. Events from the old iterable
  that arrive afterwards are ignored (stale-run guard).
- Unmount aborts the current signal; late events or a late throw cause no
  state updates and no `console.error`.
- A11y: overall state via `role="status"`, failures via `role="alert"`,
  steps as a labelled list.

## Example

```tsx
<AgentRunTimeline run={(signal) => api.preAnnotateBatch('batch-42', signal)} />
// step_started fetch → step_output ×n → step_finished ok
// step_started model → step_output ×n → step_finished ok
// step_started validate → step_finished error "Validation failed: 3 items"
// run_finished failed → status "Failed", Retry appears
// Retry → run(newSignal) — old stream's late events are dropped
```

## Target

45–60 minutes. Senior signals: one reducer owns the event → state mapping
(no per-step `useState`), a single effect owns the `for await` loop with an
`AbortController` whose `signal.aborted` guard doubles as the stale-run check,
and Retry is just "bump a key the effect depends on" rather than a second code
path.

## Interviewer follow-up

An analyst reloads the page while a run is in progress. How would you reattach
to that run — replay from the last event index the client saw, or fetch a
server-side snapshot and subscribe from there — and what does each choice
demand from the server? Separately, a step's output can reach tens of
thousands of lines: how would you virtualise the `<pre>` without breaking
auto-scroll-to-bottom while the run is still streaming?
