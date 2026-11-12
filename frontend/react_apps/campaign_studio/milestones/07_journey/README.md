# Milestone 07. Journeys: Graph Validation, Event Log and Simulator

**Difficulty:** Hard
**Estimated time:** 2–3 evenings (`graph.ts`, then `events.ts`, then the builder)
**Topics:** DAGs (Kahn, DFS cycle detection, reachability), validation ordering, event sourcing, idempotency, snapshots, forms + live validation

---

## Scenario

A journey is a small graph: an `entry` node, `send` / `wait` / `branch` steps and
`exit` nodes, connected by edges (branch edges carry a `yes` / `no` label).
Ops currently publish journeys that loop forever (the fixture "Win-back" sends
the offer again every 7 days to anyone who did not buy), or that contain a step
nobody can reach. Meanwhile the run log that comes back from the orchestrator
is a stream of events that is re-delivered on reconnect, so the dashboard double
counts sends after every network blip.

Build three things:

1. `graph.ts` — the algorithms and one `validateJourney` that explains, in a
   stable order, why a journey cannot be published.
2. `events.ts` — an immutable, idempotent reducer over run events plus
   snapshot/restore so a client can resume mid-stream.
3. `JourneyBuilder.tsx` — an outline editor with live validation, a
   deterministic `simulate` that produces events, and a summary of the folded
   run.

## Requirements

### `graph.ts`

1. `topoOrder(journey)` is Kahn's algorithm. When several nodes are ready at
   once, the one that appears first in `journey.nodes` goes first, so the order
   is deterministic (`j1` → `start, welcome, wait2d, opened, offer, nudge,
   done`). Edges whose endpoint is not a node are ignored. Return `null` when
   the graph has a cycle.
2. `findCycle(journey)` returns one cycle as a closed walk (`[a, b, c, a]`)
   along real edges, or `null`. DFS with white/grey/black colouring; on a back
   edge, slice the stack from the grey node.
3. `unreachable(journey)` is BFS/DFS from *every* `entry` node; return the ids
   not reached, in `journey.nodes` order. No entry → every node is unreachable.
4. `validateJourney(journey)` returns `ValidationIssue[]`, empty when
   publishable, otherwise in **this order**:
   1. `DUPLICATE_ID` — one issue per repeated id, `nodeIds: [id]`;
   2. `NO_ENTRY` (`nodeIds: []`) or `MULTIPLE_ENTRY` (all entry ids);
   3. `DANGLING_EDGE` — one per edge with an unknown endpoint, `nodeIds` = the
      known end(s), in edge order;
   4. `CYCLE` — the nodes of `findCycle` without the repeated last id;
   5. `UNREACHABLE` — one issue listing every unreachable id;
   6. then per node, in `journey.nodes` order (a duplicated id is visited once):
      `DEAD_END` (non-exit with out-degree 0), `OUT_DEGREE` (a `branch` with
      out-degree ≥ 1 that does not have exactly one `yes` and one `no` edge; a
      `send` / `wait` / `entry` with more than one outgoing edge — degree 0 is
      already `DEAD_END`, do not report both), `BAD_TERMINAL` (exit with an
      outgoing edge, entry with an incoming edge), `MISSING_CONFIG` (`send`
      without a non-empty string `config.templateId`; `wait` without a numeric
      `config.hours > 0`).
   Dangling edges are reported once and ignored by every other check. Every
   issue has a non-empty human message (`Cycle: offer → wait → bought → offer`).

### `events.ts`

5. `initialState()` is `{ lastSeq: 0, appliedIds: new Set(), customers: {},
   counters: { entered: 0, sent: 0, failed: 0, exited: 0, sentByTemplate: {},
   activeByNode: {} } }`.
6. `apply(state, event)` is immutable — the input state and its nested objects
   are never mutated — and **idempotent by `eventId`**: an id already in
   `appliedIds` returns the *same reference*, even if the payload differs.
   Otherwise:
   - a customer not yet in `customers` is created as if they `entered` at the
     event's node (`from` for `moved`), bumping `entered` and `activeByNode`;
     this makes the log robust to a lost first event;
   - `moved` appends `to` to `path`, sets `nodeId`, and moves the customer's
     `activeByNode` count from `from` to `to`;
   - `sent` bumps `sent` and `sentByTemplate[templateId]`; it does not move;
   - `failed` sets status `failed`, bumps `failed`, removes the customer from
     `activeByNode`;
   - `exited` sets status `exited`, bumps `exited`, removes from `activeByNode`,
     and appends the exit node to `path` if it differs from the current node;
   - `activeByNode` keys that reach 0 are deleted (so `{}` means nobody active);
   - `lastSeq = max(lastSeq, event.seq)` and `lastEventSeq` per customer
     likewise — events are applied in the order given even if `seq` is out of
     order.
7. `rebuild(events, from?)` folds with `apply` starting from `initialState()`,
   a `RunState`, or a `Snapshot` (detect by `Array.isArray(from.appliedIds)`).
   Because `apply` is idempotent, `rebuild(tail, snapshot(mid))` equals a full
   replay even when `tail` overlaps what the snapshot already contains.
8. `snapshot(state)` is a deep, JSON-safe copy (`appliedIds` as an array);
   `fromSnapshot(snap)` restores a `RunState` that does not share references
   with the input, so mutating the wire object afterwards changes nothing.

### `JourneyBuilder.tsx`

9. `simulate(journey, { customerIds, decide?, startAt? })` returns `[]` when
   `validateJourney` reports anything. Otherwise walk each customer, in order,
   from the entry node: `entered` at the entry; at a `send` emit `sent` with
   `config.templateId`; at a `wait` advance the clock by `config.hours`; at a
   `branch` follow the edge labelled by `decide(customerId, nodeId)` or, by
   default, `yes` for even customer indexes and `no` for odd ones; each hop is a
   `moved`; at an `exit` emit `exited` and stop. `eventId`s are unique
   (`evt-1`, `evt-2`, …), `seq` is a global counter, `at` is derived from
   `startAt` (default epoch) plus elapsed waits.
10. On mount load `api.getJourney(journeyId)` (status text `Loading journey…`),
    guard against the stale response on unmount/prop change, and render the
    journey name as the `<h2>`.
11. Outline: `<ol aria-label="Journey outline">` with one `<li>` per node in
    `journey.nodes` order showing the label, the type, and each outgoing edge as
    `label → target label` (`yes → Send offer`) or `→ target label`.
12. Validation: `validateJourney` on every change. When it is non-empty render
    one `role="alert"` listing `CODE: message` per issue; no alert when clean.
13. Add node: a form with `Node type` (`<select>` over `entry` / `send` /
    `wait` / `branch` / `exit`) and `Label` (`<input>`), submitted by an
    `Add node` button. Append `{ id, type, label }` with a fresh unique id, no
    config and no edges — the alert will immediately show `UNREACHABLE`,
    `DEAD_END` and (for `send`/`wait`) `MISSING_CONFIG`. Clear the label input.
14. `Simulate` is disabled while there are issues. Clicking it loads
    `api.listCustomers()`, takes the first **4** ids, runs `simulate` and folds
    the events with `rebuild`; show `Simulated N customers: E entered, S sent,
    X exited` in a `role="status"`.
15. `Save` calls `api.saveJourney(journey)`, replaces the local journey with the
    response (fresh `updatedAt`) and shows the text `Saved`. Drafts with issues
    may be saved; only `Simulate` requires a clean journey.

## Acceptance Criteria

- [ ] `topoOrder(j1)` is exactly the documented order; `topoOrder(j2)` is null;
      unknown edge endpoints are ignored.
- [ ] `findCycle(j2)` is a closed walk over `{offer, wait, bought}` whose
      consecutive pairs are real edges; `findCycle(j1)` is null.
- [ ] `unreachable(j2)` is `['legacy_sms']`; with no entry every node is listed.
- [ ] `validateJourney(j1)` is `[]`; `validateJourney(j2)` is `CYCLE,
      UNREACHABLE, DEAD_END(legacy_sms)`; the messy fixture in the test yields
      the structural codes then the per-node codes in node order, with no
      double-reporting of `DEAD_END` as `OUT_DEGREE`.
- [ ] `apply` never mutates, returns the same reference for a duplicate id,
      tracks path / counters / `activeByNode` / `sentByTemplate`, handles
      `failed`, treats an unknown customer's event as an entry, and takes
      `lastSeq` as the max.
- [ ] `rebuild(tail, snapshot(mid))` equals a full replay even with overlap;
      `snapshot` survives `JSON.parse(JSON.stringify())`; `fromSnapshot`
      restores a de-duplicating, counting state with no shared references.
- [ ] Builder renders the outline for j1 with branch outcomes, the alert for
      j2, appends nodes with live validation, simulates 4 customers through j1
      (4 entered, 8 sent, 4 exited), and saves through the api exactly once.

## Baseline a11y

- The outline is a real `<ol>` named via `aria-label`; validation lives in one
  `role="alert"`; the simulation summary is a `role="status"`.
- Form controls have visible `<label>`s; `Simulate` is a disabled `<button>`
  rather than hidden, so the operator can see it exists and why it is off.

## Constraints

- React + TypeScript only; no graph or state libraries.
- Keep the exported types and signatures; App renders `<JourneyBuilder />`
  with defaults (`api` from `shell/api`, `journeyId = 'j1'`).
- `graph.ts` and `events.ts` must be pure and free of React.

## How it plugs into the app

The **Journeys** tab renders `<JourneyBuilder />` inside a `TaskBoundary`. It
calls `shell/api` `getJourney(id)`, `listCustomers()` (for the simulation
sample) and `saveJourney(j)`. The fixtures provide `j1` ("Welcome series",
clean) and `j2` ("Win-back", with a cycle and an orphan node) — switch the id
in `app/App.tsx` to see the alert. Once milestone 3 lands the id comes from the
route (`/journeys/:id`), and once milestone 2 lands the load moves to
`useQuery(['journey', id])`.

## Interviewer follow-ups (talk-through, not implemented)

- The orchestrator streams events over a WebSocket and you only have the last
  snapshot. How do you ask for "everything after `lastSeq`", and what happens
  if the server compacted older events?
- Branch conditions should evaluate audience rules (milestone 4). Where does
  `decide` come from in production, and how do you keep `simulate` pure?
- `appliedIds` grows with every event. When does that become a problem and what
  bounded structure replaces it, given `seq` is monotonic per run?
- Two editors change the same journey. What does `saveJourney` need
  (`updatedAt` as a version? a diff?) to avoid the last write silently winning?

## Say out loud

- "Validation order is part of the contract — the alert must be stable while
  the operator edits, so structural issues first, then per-node in node order."
- Name the idempotency hazard before the counters: "every bump happens inside
  the `appliedIds` check, so a redelivered `sent` can not double count."
- "Immutable fold + snapshot = resumable: `rebuild(tail, snapshot)` is the same
  function as a full replay, just with a different starting state."
- Ask one data-shape question: "Can `seq` have gaps, and is it per run or per
  customer?"
- Name the first test you'd write: "`apply(state, sameEventAgain)` returns the
  same reference."
