# 097. Journey Builder

**Difficulty:** Very Hard
**Estimated time:** 60 min
**Topics:** Graph validation (DFS colours, BFS), simulation, controlled tree editor, derived problems, a11y tree/list/alert

---

## Scenario

Lifecycle marketers in the engagement tool design customer journeys: a trigger ("signed up"),
waits, messages on any channel, yes/no branches ("opened the email?") and exits. The first
builder let people save journeys with two triggers, branches with only a `yes` path, steps
nobody could reach, and a wait → branch → wait loop that re-sent the same push every hour until
someone noticed the bill. Build the pure graph validator and simulator, then a controlled
`JourneyBuilder` that edits the graph as an outline, reports problems live, and can dry-run a
sample customer through the journey.

## Requirements

1. `validateJourney(journey): Problem[]` returns problems in this code order. Edges whose
   `from` or `to` is not an existing step are **ignored** (never crash on them).
   - `no_trigger` (`stepIds: []`) when there is no `trigger` step; `multiple_triggers`
     (`stepIds` = every trigger id) when there is more than one.
   - `cycle`: DFS with white/grey/black colours over all steps; each back edge yields one
     problem whose `stepIds` are the ids on the cycle, starting at the back edge's target in
     path order. Message: `Cycle: <label> → <label> …`.
   - `unreachable`: BFS from the first trigger (skipped when there is no trigger). One problem
     with every unreachable id in `steps` order. Message: `Unreachable steps: <labels, comma
     separated>`.
   - `dangling_branch`: one problem per `branch` step lacking a `yes` edge, a `no` edge, or
     both (`stepIds: [branchId]`). Messages: `Branch "<label>" is missing a yes path`,
     `… is missing a no path`, `… is missing yes and no paths`.
   - `missing_exit`: one problem listing every step that is not a `branch` or `exit` and has
     no outgoing edge (a dead end). Message: `Dead end without exit: <labels>`.
2. `decideByConfig(branch, customer)`: `field = String(branch.config.field)`; when `'equals'`
   is a key of `config` return `customer[field] === config.equals`, otherwise
   `Boolean(customer[field])`.
3. `simulate(journey, customer, decide): string[]` walks from the first trigger: push the id;
   stop after an `exit`; at a `branch` follow the `yes` edge when `decide(step, customer)` is
   true else the `no` edge; otherwise follow the step's plain edge. Stop (returning the ids so
   far) when there is no edge to follow, when the target does not exist, or when
   `SIMULATION_LIMIT` (1000) ids have been collected. No trigger → `[]`.
4. `<JourneyBuilder value onChange newId? decide? />` is **fully controlled**: every edit
   calls `onChange(nextJourney)` with a new object and renders from `value` only.
   - Outline: `role="tree"` named `Journey steps`; one `role="treeitem"` per step in
     `value.steps` order with `aria-label="<label> (<kind>)"`, showing the label and kind.
   - Per step a button `Add step after` (not rendered for `exit` steps). Clicking it reveals a
     `<select>` labelled `New step kind` inside that treeitem with a blank first option and
     one option per `ADDABLE_KINDS` entry. Choosing a kind inserts
     `{ id: newId(), kind, label: <Kind capitalised, e.g. "Message">, config: {} }` right after
     the step in `steps`, hides the select, and wires edges:
     - after a non-branch step `S` with plain edge `S → T`: replace it with `S → N` and
       `N → T` (no `N → T` when `N` is an exit); without an outgoing edge just add `S → N`.
     - after a `branch`: the new step is inserted with **no** edges (wire it with the
       `Yes →` / `No →` selects).
   - Per step a button `Delete` that removes the step and **every edge touching it**. Other
     steps that pointed at it are left as they are, so the validator reports the fallout.
   - Branch steps render two `<select>`s labelled `Yes →` and `No →` whose options are a blank
     entry plus every **other** step (text = label, value = id); the value is the current
     target or blank. Changing one replaces that branch's edge for that `when` (blank removes
     it).
   - A `role="alert"` `<ul>` lists `validateJourney(value)` messages, one `<li>` each, derived
     on every render; it is not rendered when there are no problems.
   - Simulation: a textarea labelled `Customer JSON` (local draft, initial `{}`) and a button
     `Simulate`. Clicking parses the JSON; on failure a `role="status"` element reads
     `Invalid customer JSON` and the path is cleared; on success the `role="list"` named
     `Path` (always rendered) shows one `listitem` per visited step **label** (falls back to
     the id when a step is missing), using `decide ?? decideByConfig`.

## Acceptance criteria

- [ ] A well-formed trigger → wait → branch(yes/no) → messages → exit journey yields `[]`.
- [ ] `no_trigger`, `multiple_triggers`, `cycle` (ids and labels), `unreachable`,
      `dangling_branch` (three message variants), `missing_exit` as specified; edges to
      missing steps are ignored.
- [ ] `simulate` follows yes/no via the decide function, stops at exits and dead ends, returns
      `[]` without a trigger, and returns exactly 1000 ids on a cyclic journey.
- [ ] Tree renders one treeitem per step with the right accessible name.
- [ ] `Add step after` on a wait inserts the new step between the wait and its old target
      with rewired edges; the kind select disappears afterwards.
- [ ] `Delete` removes the step and all edges touching it.
- [ ] `Yes →` / `No →` show current targets, exclude the branch itself, and replace the edge.
- [ ] Alert lists problems for an invalid `value`; no alert for a valid one.
- [ ] `Simulate` renders the labels of the visited path for `{"opened": true}` and
      `{"opened": false}`; invalid JSON shows the status message.
- [ ] A parent that ignores `onChange` leaves the outline unchanged (controlled).
- [ ] Senior: deleting the branch's `yes` target leaves the branch dangling and the alert shows
      `Branch "Opened email?" is missing a yes path` immediately (parent applies the change).
- [ ] Senior: pointing `No →` at an upstream wait creates a cycle that the alert reports
      immediately, naming both steps.

## Baseline a11y

- Outline is a `tree` with `treeitem`s that have explicit `aria-label`s; buttons inside are
  real `<button>`s.
- Branch selects and the kind select have accessible names (`aria-label` or `<label>`).
- Problems are announced through `role="alert"`; the simulation path is a named `list`; the
  JSON parse failure is a polite `role="status"`.

## Constraints

- No third-party libraries (no graph or state library).
- `validateJourney` and `simulate` are pure, synchronous and never throw on malformed edges.
- The component keeps no copy of `value` in state; only the JSON draft, the open kind select
  and the last simulation result are local.

## Interviewer follow-ups

- The alert re-validates on every render. At 500 steps the DFS/BFS run on each keystroke in
  the JSON textarea — how do you keep validation off the typing path?
- Journeys are edited by several marketers at once. Which operations commute (insert, delete,
  rewire) and how would you model them as commands for an undo stack and for merging?
- `simulate` needs a decision per branch, but real conditions are "opened within 3 days".
  How would you model time in the simulator without a real clock?
- The tree is an outline, but a journey is a DAG with joins. How would you render a branch's
  two paths and a later re-join without duplicating steps in the tree?

## Say out loud

- **State shape first:** `Journey = { steps: Step[]; edges: Edge[] }` normalised (steps by id,
  edges as `from/to/when`), problems derived, never stored.
- **Race / cleanup hazard:** none async — the hazard is stale derived data: the path list is
  a snapshot from the last `Simulate` click and can disagree with a `value` edited afterwards.
- **One data-shape question:** "Can two steps point at the same step (a join), and can a
  branch's yes and no point at the same target?"
- **One failure-handling question:** "When deleting a step that others point at, should the
  editor refuse, auto-rewire to the deleted step's target, or just report the dangling
  branch?"
- **First test you'd write:** `validateJourney` finds the two-step cycle `a → b → a` with
  `stepIds` in path order — the DFS before any UI.
