# 078. Agent Event Reducer

**Difficulty:** Very Hard · **Priority:** P1
**Estimated time:** 60 min
**Topics:** Event sourcing, idempotency, ordering by sequence number, buffering gaps, structural sharing, tree selectors

---

## Scenario

The annotation platform's "pre-annotate batch" agent streams events while it
runs: tool calls start, emit partial output, finish, and nest (a `call_model`
call spawns per-batch child calls). The stream rides over a reconnecting SSE
channel, so the client sees events **duplicated** (at-least-once delivery),
**out of order** (two workers publish to one topic), and **replayed** from the
start after a reconnect.

The first client applied events as they arrived: duplicate `call_output` chunks
doubled the transcript, a `call_finished` that overtook its `call_started`
was dropped, and every reconnect re-rendered the whole tree even though nothing
changed. Build a pure reducer that makes the UI indifferent to all of that.

Pure TypeScript, no React. The UI (079, 080) will feed it through `useReducer`.

## API

```ts
export type AgentEvent =
  | { eventId: string; seq: number; type: 'run_started' }
  | { eventId: string; seq: number; type: 'call_started'; callId: string; parentId: string | null; tool: string }
  | { eventId: string; seq: number; type: 'call_output'; callId: string; chunk: string }
  | { eventId: string; seq: number; type: 'call_finished'; callId: string; status: 'succeeded' | 'failed' | 'cancelled'; message?: string }
  | { eventId: string; seq: number; type: 'run_finished'; status: 'succeeded' | 'failed' | 'cancelled' };

export interface ToolCall {
  id: string;
  parentId: string | null;
  tool: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  output: string;
  message?: string;
  childIds: string[];
}

export interface RunState {
  status: 'idle' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  calls: Record<string, ToolCall>;
  rootIds: string[];
  seenEventIds: Set<string>;
  lastSeq: number;
  buffered: AgentEvent[];
}

export const initialRunState: RunState;
export function agentRunReducer(state: RunState, event: AgentEvent): RunState;
export function selectTree(state: RunState): ToolCallNode[];   // ToolCallNode = ToolCall & { children: ToolCallNode[] }
export function selectRunning(state: RunState): ToolCall[];
```

## Requirements

1. **Idempotent by `eventId`.** An event whose `eventId` is already in
   `seenEventIds` returns the **same state reference**. This includes a
   duplicate of an event that is currently buffered.
2. **Strict `seq` order.** `seq` starts at `1`; `lastSeq` is the highest seq
   applied so far (`0` initially).
   - `seq === lastSeq + 1` → apply, bump `lastSeq`.
   - `seq > lastSeq + 1` → **buffer** (record the eventId, do not apply, do not
     bump `lastSeq`). When the gap fills, apply the arriving event and then
     drain `buffered` in ascending seq order for as long as the next seq is
     contiguous. Buffered events that are still non-contiguous stay buffered.
   - `seq <= lastSeq` with an unseen `eventId` is a stale replay → ignored,
     **same state reference**.
3. `run_started` → `status: 'running'`.
4. `call_started` creates the call with `status: 'running'`, empty `output`,
   `childIds: []`. With `parentId` pointing to a known call, the id is appended
   to the parent's `childIds`; with `parentId: null` **or an unknown parent**,
   the id is appended to `rootIds`.
5. `call_output` appends `chunk` to the call's `output` (exact concatenation).
   Output for an unknown `callId` is ignored — but the event still counts as
   applied (`lastSeq` advances, `eventId` recorded).
6. `call_finished` sets `status` and `message`; the `output` accumulated so far
   is preserved (including on `failed`). Unknown `callId` → ignored like 5.
7. `run_finished` sets the run `status`. When it is `cancelled`, every call
   still `running` becomes `cancelled`; already-finished calls are untouched.
8. **Structural sharing.** Calls not touched by an event keep their object
   identity (`toBe`), and `state.calls` keeps its identity when no call changed.
9. The reducer never mutates its input state.
10. `selectTree` returns the nested tree in `rootIds` / `childIds` order;
    `selectRunning` returns calls with `status: 'running'` in depth-first tree
    order.

> `ToolCall.status` includes `queued` because the real platform also emits a
> `call_queued` event. This task's event set never produces it; keep it in the
> union, nothing more.

## Acceptance criteria

- [ ] `initialRunState` is `idle`, empty, `lastSeq: 0`.
- [ ] `run_started` → `running`; `call_started` → running call in `rootIds`; nested `call_started` → in the parent's `childIds`, not in `rootIds`.
- [ ] Unknown `parentId` → treated as root.
- [ ] `call_output` concatenates chunks exactly; unknown `callId` ignored but `lastSeq` advances.
- [ ] `call_finished failed` keeps partial `output` and stores `message`.
- [ ] `run_finished cancelled` cancels running calls only; finished calls keep identity.
- [ ] `run_finished succeeded` leaves `state.calls` identity untouched.
- [ ] Duplicate `eventId` → same reference (applied or buffered).
- [ ] Stale `seq` with new `eventId` → same reference.
- [ ] Out-of-order `1, 3, 2` → final state `toEqual` in-order `1, 2, 3`, `buffered` empty, `lastSeq 3`.
- [ ] `1, 4, 3, 2` drains all; `1, 4, 2` applies 2 and keeps 4 buffered.
- [ ] A buffered event duplicated before the gap fills is applied exactly once.
- [ ] Reconnect replay of `1..3` when already at `lastSeq 3` returns the same reference for every event (senior).
- [ ] Untouched calls keep object identity across unrelated events (senior).
- [ ] Input state is not mutated.
- [ ] `selectTree` nests in order; `selectRunning` filters in depth-first order.

## Baseline a11y

Not a UI task. Note for the follow-up: the UI that consumes this state must
announce run status via `role="status"` and failures via `role="alert"`.

## Constraints

- No third-party libraries. No React.
- `seenEventIds` is a `Set<string>`; create a new `Set` when you add to it — do
  not mutate the previous state's set.
- Runs in the default `node` Jest environment.

## Interviewer follow-ups (talk through, do not implement)

- `seenEventIds` grows unbounded over a long run. What can be dropped once `lastSeq` has advanced past an event, and what does that do to the stale-replay rule?
- A gap never fills (the event was lost for good). How does the client ask for a resync, and what does the reducer need (a `resync` event carrying a snapshot?) to recover without losing buffered events?
- The server guarantees per-`callId` order but not global order. Could you relax the global `seq` rule to per-call sequencing, and what breaks in the tree?
- How would you expose this to React — `useReducer` directly, or `useSyncExternalStore` over a store that applies events outside render?

## Say out loud (before typing)

- **State shape first:** normalized `calls` by id + `rootIds` / `childIds` for structure; `seenEventIds`, `lastSeq`, `buffered` are the delivery-layer bookkeeping.
- **Race / cleanup hazard:** a gap-fill must drain buffered events in seq order and stop at the next gap — a `while` loop over a sorted buffer, not a single pass.
- **One data-shape question:** is `seq` global to the run or per-connection? (Everything here assumes global, starting at 1.)
- **One failure-handling question:** what should `call_output` for an unknown `callId` do — drop, or buffer until `call_started`? (Here: drop.)
- **First test you'd write:** "applying the same event twice returns the same state reference."
