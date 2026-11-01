# Apple Loop — Deeper Coding Tasks (074–091) + Prompt for Claude

Continues the numbering of `React Practice Tasks — Netflix POSA Prep · Apple AIML Tier 3` (last task: 073).
Purpose: harder, longer, follow-up-heavy tasks for the **full Apple loop** coding rounds (60 min builds, not the 30 min CoderPad screen).

---

## PART 1 — PROMPT TO GIVE CLAUDE (copy this block into the other repo)

```
You are helping me build a practice repo of frontend coding tasks for an Apple interview loop
(AIML Annotation Platform & Agentic UI, React + TypeScript).

I will give you a task list (the "TASK LIST" section below). For EACH task, create a folder under
`frontend/faang_questions/react/<NNN>_<folder>/` containing exactly:

1. `README.md`
   - Title, difficulty, estimated time
   - Scenario (2-4 sentences, ML data-annotation platform domain: annotators, QA analysts,
     model-assisted suggestions, agent runs)
   - Requirements (numbered, testable)
   - Acceptance criteria (checklist, each one maps to at least one test)
   - Baseline a11y requirements (roles, labels, keyboard) — graded inline
   - Constraints (no third-party libraries unless the task says so)
   - Interviewer follow-ups (3-4 bullets, NOT implemented, for talk-through)
   - "Say out loud" checklist: state shape first, name the race/cleanup hazard, ask one data-shape
     question, ask one failure-handling question, name the first test you'd write
2. `<Component or hook name>.tsx` (or `.ts` for non-UI tasks) — a STUB ONLY:
   - Fully typed props / function signatures / exported types (discriminated unions where relevant)
   - Body is `throw new Error('Not implemented')` or returns null
   - Do NOT include any solution logic, hints in comments, or partial implementations
3. `<name>.test.tsx` (or `.test.ts`)
   - First line: `/** @jest-environment jsdom */` for UI tasks
   - React Testing Library + @testing-library/user-event, jest fake timers where timing matters
   - Query by role/label, never test ids
   - Mock at the boundary only (fetch, EventSource, IntersectionObserver, ResizeObserver, timers)
   - Tests are the grader: cover happy path, races/out-of-order, cancellation/unmount, error paths,
     keyboard interaction, and accessibility roles
   - Group with `describe` blocks matching the README requirements; test names read as requirements
   - Include at least 2 tests that only a correct, robust implementation passes (the "senior" tests)
4. Do NOT create a solution file. Do NOT implement the stubs.

Also:
- Add each task as a row in the repo's task table (columns: #, Folder, Scenario, Diff, Done) and in a
  new "Tier 4 — Apple Loop Deep Tasks" section. Leave Done empty.
- If test helpers are shared (fake EventSource, fake ReadableStream, fake IntersectionObserver),
  put them in `frontend/faang_questions/react/_helpers/` once and import them.
- Verify every test file at least type-checks (`tsc --noEmit`) and that tests FAIL against the stubs
  (not error on import). Report any task where tests pass against a stub — that test is too weak.
- Work through all tasks; do not stop to ask about each one. At the end, give me a short table:
  task, number of tests, helpers used, anything ambiguous you decided.

TASK LIST: (paste the TASK LIST section from this file below this prompt)
```

---

## PART 2 — TASK LIST

Difficulty: **M** Medium · **H** Hard · **VH** Very Hard (60 min, many follow-ups).
Priority: **P1** most likely in the loop · **P2** likely · **P3** stretch.
Format of every task folder: `README.md` + typed stub + test suite (see prompt above).

### Block A — Streaming & Agentic (P1)

| # | Folder | Scenario | Diff | Prio |
|---|---|---|---|---|
| 074 | `sse_stream_parser` | Pure TS `parseSSE(stream: ReadableStream<Uint8Array>)` → async iterator of `{event, data, id, retry}`. Chunks can split mid-line, mid-multibyte UTF-8 char, and between `\r` and `\n`. Support multi-line `data:`, comments (`:`), blank-line dispatch, and `Last-Event-ID` tracking. | H | P1 |
| 075 | `reconnecting_event_source` | `useEventStream(url)` hook over a fake `EventSource`: exponential backoff with jitter, resume with `Last-Event-ID`, dedupe by event id, pause when tab hidden, close on unmount, status `connecting/open/reconnecting/closed`. | H | P1 |
| 076 | `streaming_markdown_renderer` | Render model output arriving token by token. Unclosed code fences, bold, links, and HTML tags must never break the DOM or execute markup (sanitize). Batch updates to one per animation frame. Component API: `<StreamingMarkdown source={string} done={boolean} />`. | H | P1 |
| 077 | `stick_to_bottom_log` | Transcript container that auto-scrolls while streaming, **stops** when the user scrolls up, shows a "Jump to latest" button with unread count, and resumes when the user returns to the bottom. Handles content growth via ResizeObserver. | M | P1 |
| 078 | `agent_event_reducer` | Pure reducer for agent runs: events can arrive duplicated, out of order (by `seq`), or after reconnect replay. Maintain a tool-call tree (`parentId`), statuses `queued/running/succeeded/failed/cancelled`, partial output preserved on failure. Idempotent by `eventId`. | VH | P1 |
| 079 | `agent_approval_gate` | Run pauses on a `requires_approval` event showing a proposed action diff. Approve / reject / edit-and-approve. Decision is sent once (double-click safe), expires after a server timeout event, and the UI recovers if the stream reconnects mid-decision. | H | P1 |
| 080 | `cancel_and_resume_run` | Cancel button during a streaming run: aborts the fetch, ignores late events from the cancelled run (run id), shows "Cancelled — partial output kept", and a Resume/Retry that starts a new run id. Page reload restores state from `sessionStorage` + server snapshot. | H | P1 |

### Block B — Annotation Interfaces (P1–P2)

| # | Folder | Scenario | Diff | Prio |
|---|---|---|---|---|
| 081 | `span_labeler_overlaps` | Text with labeled spans (`{start, end, label}` in character offsets). Mouse and keyboard selection → offsets (incl. selection across inline elements and emoji/surrogate pairs). Render by splitting text into segments at all span boundaries with overlapping/nested spans. Delete, change label, extend with Shift+Arrow. | VH | P1 |
| 082 | `command_stack_undo` | Generic `useCommandHistory<T>()` with command objects `{do, undo, merge?}`, coalescing consecutive edits (typing, drag), redo invalidation on new command, max history size, and batch transactions. Used by a small labeler demo in the tests. | H | P1 |
| 083 | `bbox_annotator` | SVG overlay over an image: draw box by drag, move, resize via 8 handles, zoom/pan with coordinates always stored in **image space**, clamp to image bounds, arrow-key nudge (Shift = 10px), Delete removes, pointer capture, Escape cancels drag. | VH | P2 |
| 084 | `review_queue_lease` | Reviewer queue UI: current task has a server lease with heartbeat (`POST /lease/renew` every N seconds), prefetches next task, optimistic Submit/Skip/Flag, handles `lease_expired` (task returned, UI explains and loads next), double-submit safe, hotkeys (A/R/S). | H | P1 |
| 085 | `autosave_conflict_editor` | Task editor with autosave: debounced PUT with `version`, queue of pending patches, `409 conflict` shows a field-level merge UI (mine/theirs/both), offline detection with local draft, "Saved / Saving / Offline / Conflict" status that is announced with `aria-live`. | VH | P2 |
| 086 | `model_suggestions_panel` | Model pre-labels with confidence scores: filter by threshold slider, accept one, accept all above threshold (undoable as one command), reject, keyboard navigation through suggestions, stale suggestions discarded when the underlying text version changes. | H | P2 |

### Block C — Data-Dense UI & Performance (P2)

| # | Folder | Scenario | Diff | Prio |
|---|---|---|---|---|
| 087 | `variable_height_virtual_list` | Virtualized list with **unknown, variable** row heights: measure via ResizeObserver, cache heights, correct total scroll height, scroll anchoring when rows above the viewport resize, `scrollToIndex`, overscan, 100k items, keyboard navigation with `aria-setsize/posinset`. | VH | P2 |
| 088 | `data_grid_a11y` | Annotation QA grid: sortable columns, sticky header, column resize, roving tabindex with arrow-key cell navigation (`role="grid"`), row selection with Shift+click ranges, selection survives sorting and paging. | VH | P2 |
| 089 | `url_state_review_filters` | Filters, sort, page, and selected task id synced with the URL (History API, no router library): back/forward restore state, invalid params fall back safely, debounced text filter doesn't spam history entries, shareable links. | M | P2 |

### Block D — Architecture Primitives (P2–P3)

| # | Folder | Scenario | Diff | Prio |
|---|---|---|---|---|
| 090 | `mini_store_sync_external` | Build `createStore(initial)` + `useStore(selector, equalityFn?)` with `useSyncExternalStore`. No tearing, selector-based subscriptions (components re-render only when their slice changes), batched updates, `getServerSnapshot`, unsubscribe on unmount. Tests assert render counts. | H | P2 |
| 091 | `transition_filter_lab` | 10k-row list with a filter input. Make typing feel instant using `useTransition` / `useDeferredValue`; show a pending indicator; tests prove input updates urgently while the list lags, and that stale renders are discarded. Includes README questions comparing debounce vs transition. | M | P3 |

---

## PART 3 — RECOMMENDED ORDER

| Order | Tasks | Why |
|---|---|---|
| 1 | 074 → 075 → 076 → 077 | Streaming chain: parse → reconnect → render → scroll. Matches your Duo experience. |
| 2 | 078 → 079 → 080 | Agent run state and control flow. Highest-probability loop prompts. |
| 3 | 081 → 082 | Annotation core: spans and undo. Most unique to this team. |
| 4 | 084 → 086 → 085 | Review queue, suggestions, autosave/conflict. |
| 5 | 087 → 088 → 089 | Data-dense UI. |
| 6 | 083 | Bounding boxes (if time; depends on whether images are in scope). |
| 7 | 090 → 091 | Architecture primitives and concurrent rendering. |

**Timed run:** every task in Blocks A–B should be done once in 60 minutes with only the README open and tests as the grader, then once more from a blank file a week later (re-solve rule).

**Interview habits for every task:** narrate state shape first (discriminated union), name the race/cleanup hazard before writing the effect, ask one question about data shape and one about failure handling, name the first test you'd write, and mention accessibility and privacy unprompted.

---

## PART 4 — Tier 4 progress table (Apple Loop Deep Tasks)

Task table for this tier (the repo-wide `TASKS.md` was retired; this is the tracking table). Folders live under `frontend/faang_questions/react/<NNN>_<folder>/` with README + typed stub + tests; shared fakes are in `frontend/faang_questions/react/_helpers/`.

| #   | Folder | Scenario | Diff | Done |
| --- | --- | --- | --- | --- |
| 074 | `sse_stream_parser` | Pure TS SSE parser over ReadableStream: split chunks, multibyte, CRLF, multi-line data, ids, retry, abort | H |      |
| 075 | `reconnecting_event_source` | useEventStream: backoff+jitter, Last-Event-ID resume, dedupe, pause when hidden, close on unmount | H |      |
| 076 | `streaming_markdown_renderer` | Safe markdown from token stream: unclosed constructs, sanitised HTML, one commit per frame | H |      |
| 077 | `stick_to_bottom_log` | Auto-scroll log that stops when the user scrolls up, "Jump to latest (N)", ResizeObserver growth | M |      |
| 078 | `agent_event_reducer` | Pure reducer: idempotent by eventId, seq ordering with buffering, tool-call tree, partial output kept | VH |      |
| 079 | `agent_approval_gate` | Approve / reject / edit-and-approve a proposed action: diff, single send, expiry, reconnect-safe | H |      |
| 080 | `cancel_and_resume_run` | Cancel aborts + ignores late events by runId; Resume = new run; reload restores from storage + snapshot | H |      |
| 081 | `span_labeler_overlaps` | Character-offset spans with overlaps/nesting, Selection API, surrogate-pair safety, Shift+Arrow extend | VH |      |
| 082 | `command_stack_undo` | useCommandHistory: command objects, coalescing by mergeKey, redo invalidation, limit, batches | H |      |
| 083 | `bbox_annotator` | SVG boxes in image space: draw/move/resize handles, zoom/pan, clamp, nudge, pointer capture, Escape | VH |      |
| 084 | `review_queue_lease` | Reviewer queue: lease heartbeat, prefetch next, optimistic decisions, lease_expired recovery, hotkeys | H |      |
| 085 | `autosave_conflict_editor` | Debounced versioned autosave, queued patches, 409 field-level merge UI, offline draft, aria-live status | VH |      |
| 086 | `model_suggestions_panel` | Confidence slider, accept one / all above threshold as one command, keyboard nav, stale suggestions dropped | H |      |
| 087 | `variable_height_virtual_list` | Unknown row heights: measure, cache, scroll anchoring, scrollToIndex, overscan, 100k rows, setsize/posinset | VH |      |
| 088 | `data_grid_a11y` | role=grid: sort with aria-sort, column resize, roving cell focus, Shift+click ranges, selection survives sort | VH |      |
| 089 | `url_state_review_filters` | Filters/sort/page/selection in the URL via History API, back/forward, safe fallbacks, debounced replaceState | M |      |
| 090 | `mini_store_sync_external` | createStore + useStore on useSyncExternalStore: selector subscriptions, batching, no tearing, render counts | H |      |
| 091 | `transition_filter_lab` | 10k-row filter with useDeferredValue/useTransition: urgent input, lagging list, stale renders discarded | M |      |

Re-solve rule: anything solved with hints goes back in the queue for a blank-file redo a week later.

---

*Apple Loop Deep Tasks · Artur Fedorov · Generated by Claude*
