# Netflix UI Technical Interview — 7-Day Plan

**Round:** UI Focused Technical Interview · 60 min · CodeSignal · Senior UI Engineer (L5, POSA team)
**Tests:** UI feature + data-structure choice (with alternatives), state management, async handling, performance, code cleanliness, think-aloud protocol
**Scheduling note:** you control the date within 2–10 days — take day 8–9 if possible; this plan needs its week.

---

## What to DROP this week (not in this round's scope)

`node/` track · `css/` track · `typescript/` type-design tasks · `algo/` Tiers 2–4

Netflix confirmed: ONE 60-minute UI coding round. Everything below serves exactly that.

---

## Day 1 — Async patterns (Netflix's signature axis) · ~3h

| Task | Why |
| --- | --- |
| `algo/067_in_flight_dedupe` | request coalescing — the fetch-dedupe every app needs |
| `algo/068_async_queue` | serial execution, failure isolation |
| `algo/078_concurrency_pool` | bounded concurrency (repeat drill) |
| `algo/077_retry_backoff` | backoff + retryable classification (repeat drill) |
| `algo/073_dependency_task_runner` | capstone — topo sort + pool, your own interview story |

**Rule:** 25-min timer per task. Narrate aloud, alone in the room — feels stupid, works. State the complexity *before* running tests.

## Day 2 — Async UI: fetch + race + state machine · ~3h

| Task | Why |
| --- | --- |
| `react/005_fetch_on_mount` (finish) | four states, unmount safety |
| `react/006_race_free_search` | the stale-response race — classic prompt |
| `react/014_use_async` | idle/loading/success/error state machine |
| `react/022_polling_status_widget` | polling, backoff, terminal states |
| `react/023_optimistic_toggle` | optimistic update + rollback |

These are the "handling async requests" bullet from the invitation, verbatim.

## Day 3 — Data structures BEHIND UI features · ~3h

| Task | Alternatives speech to rehearse |
| --- | --- |
| `react/024_partner_autocomplete` ← highest-probability prompt shape | trie vs sorted-prefix filter — when each wins |
| `react/037_normalized_store` | byId/allIds vs nested arrays — update cost |
| `react/038_row_selection_state` | `Set` vs array for selection — membership cost |
| `react/016_use_undo_state` | two stacks vs snapshot list (your algo 004 as a hook) |

"Most appropriate data structure, **explaining their choice and alternatives**" — that sentence from the email is graded here.

## Trees & Graphs block — split across Day 3 and Day 5 evenings · ~3h total

UI features ARE trees (component trees, file explorers, nested menus), and POSA tooling is dependency graphs — this is the most likely deep-dive territory for this team.

**Trees (Day 3 evening):**

| Task | Why |
| --- | --- |
| `algo/035_folder_sizes` | post-order aggregation — the file-explorer question |
| `algo/038_common_container` | LCA of two selected elements — selection UIs |
| `algo/016_search_highlight` ⭐ | your real Google question: tree walk + word window across node boundaries |
| `algo/042_layout_clipboard` (if time) | serialize/deserialize a layout tree round-trip |

**Graphs & dependencies (Day 5 evening):**

| Task | Why |
| --- | --- |
| `algo/053_build_order_dfs` ⭐ | your real Netflix question: three-color DFS, no Kahn — non-negotiable redo |
| `algo/056_spreadsheet_recalc` | recompute only affected cells — the internal-tools graph question |
| `algo/044_router_reachability` ⭐ | build a graph from raw data, then BFS — the modeling step is the skill |

**Alternatives speech to rehearse:** adjacency list vs matrix (and why UI graphs are always sparse); recursive DFS vs explicit stack (10k-deep trees overflow — say it before they ask); Kahn vs DFS-with-colors for dependency order; when a tree is really a graph (shared nodes, cycles from bad data — guard before recursing).

## Day 4 — MOCK #1 (full 60 min) · ~2.5h

Unseen prompt via `/faang-interviewer`. CodeSignal conditions: plain editor mindset, no copilot, `console.log`/inline-assert verification, TypeScript. Afterwards: review the scorecard and write down every **communication** miss (not code miss).

## Day 5 — Performance + virtualization · ~3h

| Task | Why |
| --- | --- |
| `react/045_virtualized_list` | windowing from scratch — top-tier interview prompt |
| `react/041_memo_boundaries` | identity churn hunt |
| `react/044_derived_data_memo` | derive-don't-store at 10k rows |
| `react/012_use_fetch` or `013_use_interval` | warm-up |

Watch the render counters drop live: `npm run dev:react`.

## Day 6 — MOCK #2 + redo list · ~3h

Second 60-min mock, different prompt class (widget with polling + cache, or data table with sort/filter/selection).

**Blank-file redos due this week:** `react/003`, `react/004`, `algo/004`.

## Day 7 (day before) — LIGHT · ~1.5h

No new problems. Re-read review notes (recurring themes below). Skim the culture memo. Prepare two collaboration stories: one disagree-and-commit, one refactor-vs-rebuild. Sleep.

---

## Prompt archetypes → repo tasks (probability-ranked)

The email describes a **staged composite prompt**: one widget, all four axes (state / async / DS / perf), requirements fed in stages. Mapping to what's built:

| Archetype (est.) | Repo tasks | Status |
| --- | --- | --- |
| **1. Typeahead/search engine** (~30%) | `react/024_partner_autocomplete` · `react/006_race_free_search` · `react/010_use_debounced_value` · `algo/067` dedupe · `algo/070` SWR cache · `algo/016` ⭐ highlight | algo parts ✓ solved; **react fusion tasks open** |
| **2. Async tree engine** (~20%) | `algo/053` ⭐ build-order DFS · `algo/056` spreadsheet recalc · `algo/044` ⭐ router reachability · `algo/035` ✓ · `038` ✓ · `042` ✓ · `ui_components/003` nested checkboxes ✓ · `016` file explorer ✓ | statics ✓; **graph trio open** |
| **3. Data-table engine** (~20%) | `react/019_paginated_table` · `react/038_row_selection_state` · `react/033_filter_reducer` · `react/044_derived_data_memo` · `algo/005` ✓ grouping · `ui_components/028` ✓ | **all four react tasks open** |
| **4. Scheduler / API cache** (~15%) | `algo/068–071` ✓ · `077–078` ✓ · `079_token_bucket` · `080_request_batcher` · `073` capstone · `react/021_retry_panel` · `react/022_polling_status_widget` | core ✓; 073/079/080 + react pair open |
| **5. Other** (~15%) — undo/redo store, notification center | `algo/004` ✓ · `react/016_use_undo_state` · `react/035_undo_redo_reducer` | mixed |

**Coverage gap the repo doesn't close:** no single task *fuses* three mechanisms into one staged artifact (e.g., typeahead = debounce + dedupe + cache + cancel grown over 4 stages). That fusion under staged requirements is the closest simulation of the actual round — get it via a generated composite task or a live mock.

## The 60-minute protocol (their email IS the rubric — rehearse verbatim)

| Minutes | What you do |
| --- | --- |
| 0–5 | Restate the problem. Clarify: data size? update frequency? interaction (keyboard? concurrent edits?)? error/empty states? persistence? Say numbers: "assume ~10k rows?" |
| 5–10 | Plan out loud: data structure + **alternatives** + why this one. Slice the work: "core first, then edges, then perf." |
| 10–45 | Code in slices; check in after each ("does this match what you expected?"). Run early, run often. |
| 45–55 | Corner cases aloud: empty, single, duplicate, race, rapid input. Fix what you find. |
| 55–60 | Deferred-items list: "with more time I'd add X because Y" — explicitly scored. |

## Personal watch-list (from this repo's review history)

1. **Dead defensiveness** — guards / `?.` / `||` for states your own invariants exclude. Before finishing, ask: *what can I remove?*
2. **`as`-casts instead of narrowing**; the has/set/get map dance.
3. **Over-memoization** of cheap values.
4. **Apply interviewer feedback immediately** (the `role="button"` lesson).
5. **Leftover `console.log`s = instant ding.** Sweep before saying "done."

## CodeSignal specifics

- No jest, no autocomplete: practice with a quick inline `assert` / `console.log` harness — that's your verification tool in the room.
- L4 vs L5 in that salary band is mostly the protocol table above, not the code: **L5 drove the session; L4 solved the problem.**

---

*Netflix UI Interview Prep · Artur Fedorov · Generated by Claude*
