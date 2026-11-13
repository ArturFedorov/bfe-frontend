# Frontend / UI Engineer Interview Plan

**Targets, in priority order:** Apple → Netflix → Google → Meta (last; few UI openings). Written 2026-11-13.
The earlier AIML Annotation Platform loop is closed; its tasks stay because AI product UI (streaming,
long-running agent runs, approval flows) is now asked across many departments at all four companies.

**How this plan works.** A sequence, not a calendar — you set the pace. Each block mixes a short warm-up
(pure TypeScript or JS fundamentals, 15–30 min), a build (30–60 min) and, from block 4, one evening of the multi-evening project.
Tests are the grader; a task is done when its suite is green from a blank file. Anything solved with hints goes
back in the queue for a redo a week later. Status of every task: run its suite (`npx jest <folder>`).

**Where things live**
- `algo/<NNN>_*` — pure TS (`algo/TASKS.md`: Topics 1–8 DSA, 9 async, 10 marketing utilities)
- `frontend/javascript_utilities`, `frontend/async_patterns`, `frontend/dom_and_browser` — JS fundamentals
- `frontend/faang_questions/react/<NNN>_*` — React tasks; `react/apple-loop-deep-coding-tasks.md` is the catalog for 074–111
- `frontend/react_apps/campaign_studio` — multi-evening project; milestone 1 given, you build 2–7
- `frontend/faang_questions/node_netflix` — Netflix-style parser/tooling practicals

**What each company's loop weights** (from the postings and past rounds in this repo)

| Company | Coding rounds look like | Weight in this plan |
| --- | --- | --- |
| Apple | Practical component builds in CoderPad/loop (async, state, a11y), JS fundamentals questions woven into the conversation (closures, `this`, event loop, promises), design-system and architecture discussion, team-specific domain (ASE: React Query, router, MFE, event-driven) | Blocks 0, 1, 3, 4, 5 |
| Netflix | Practical async orchestration and parser-style tasks in plain TS, culture memo ("Dream Team", "Informed Captain") | Blocks 0, 1, 3, `node_netflix`, 7 |
| Google | 1 DSA round even for frontend (trees, graphs, sliding window, intervals), 1–2 UI rounds building a widget from scratch with a11y, 1 frontend system design, behavioural ("Googleyness") | Blocks 1, 2, 6, 7 |
| Meta | Pure-JS phone screen (debounce, promise utils, flatten, event emitter), 35-min UI widget, frontend system design | Blocks 0, 2, 7 |

---

## Block 0 — JS fundamentals (Apple conversation, Netflix plain-TS, Meta phone screen)

Pure TypeScript, 15–25 minutes each, no React. Do one as the warm-up of every sitting in blocks 1–5; the first row of each table below is the suggested pairing. The point is fluency: talk through `this`, closures, the microtask queue and timer semantics while typing. Status: run the suite (older stubs return a never-settling promise, so grep won't tell you).

| Theme | Tasks (in order) | What to be able to say |
| --- | --- | --- |
| Timing and closures | js_utilities 001 debounce (redo from blank), 015 throttle, 016 once, 017 memoize, 028 setInterval via setTimeout, 029 clear all timers; dom_and_browser 009 rAF throttle | Leading vs trailing edge, cancel/flush, closure over timer id, `this` and args forwarding |
| Promises and the event loop | js_utilities 010 all, 011 race, 012 allSettled, 013 any, 014 custom Promise (redo); async_patterns 004 sleep (abortable), 005 sequential vs parallel, 006 lazy promise, 010 promisify | Microtasks vs macrotasks, then-chaining, `AggregateError`, thenable assimilation, why `await` in a loop serialises |
| Async orchestration | async_patterns 001 concurrency limiter, 002 retry with backoff, 003 cancelable promise, 007 async generator, 008 rate limiter, 009 batch requests, 011 paginated fetcher | Pool vs batch, settle-then-schedule, jitter, `for await`, abort propagation |
| Functions and `this` | js_utilities 008 bind, 009 call/apply, 018 curry, 023 object assign, 024 object create | Explicit vs implicit binding, arrow functions, partial application, prototype chain |
| Arrays and objects | js_utilities 002–007 array methods, 005 / 030 flat (recursive and iterative), 019 deep clone, 020 deep equal, 021 JSON stringify, 022 JSON parse, 025 keys/values/entries, 027 string trim | Sparse arrays and holes, cycles in clone/equal, Dates and `NaN` in equality, recursion vs explicit stack |
| Events and DOM | js_utilities 026 event emitter; dom_and_browser 001–003 selectors, 004 event delegation, 005 flatten DOM tree, 006 serialize, 007 virtual DOM diff, 008 MutationObserver, 010 tree builder | Bubbling vs capture, `closest`, tree traversal order, keyed diffing, observer batching |

Solved at least once: js_utilities 001, 008, 010–014, 017, 026; async_patterns 002, 003, 006–011 (001 and js 014 were reset to stubs on purpose). Before any phone screen, redo from a blank file: 001 debounce, 010 all, 014 custom Promise, async 001 limiter, 026 event emitter. Everything else is first-pass.

## Block 1 — Async foundations (all four)

| Warm-up (algo / JS) | Build (React) | Why |
| --- | --- | --- |
| js_utilities 010 all, 011 race (redo from blank) | react 005 fetch states → 006 race-free search | The race is the single most common loop prompt |
| async_patterns 003 cancelable, 004 sleep, algo 066 timeout | react 012 useFetch, 014 useAsync | Same race as hooks; stable identities, stale closures |
| js_utilities 017 memoize, algo 067 in-flight dedupe, 070 stale-while-revalidate | react 018 async states panel | Discriminated unions, impossible states |
| async_patterns 002 retry, 001 limiter, 008 rate limiter | react 022 polling widget, 021 retry panel | Settle-then-schedule, backoff, terminal states |
| js_utilities 001 debounce, 015 throttle | react 010 useDebouncedValue → 024 autocomplete | Debounce + abort + combobox a11y |

## Block 2 — Classic UI widgets (Google / Apple UI rounds, 35–45 min each)

Tier 6, tasks 102–111, plus the older component tasks. Build from a blank file with the README open; narrate a11y choices. Warm-up before each: one Block 0 task from the "Events and DOM" or "Arrays and objects" rows (event delegation and tree flattening are the DOM muscles these widgets use).

| Task | Widget | Core skill |
| --- | --- | --- |
| react 102 | File explorer tree with nested indeterminate checkboxes | Tree ARIA, derived parent state |
| react 103 | Image carousel with autoplay, swipe, lazy neighbours | Timers that pause on hover/focus, pointer events |
| react 104 | Star rating with half stars | Radiogroup ARIA, controlled/uncontrolled |
| react 105 | Transfer list with filters | Multi-select listbox, highlight ≠ membership |
| react 106 | Kanban board with keyboard move mode and pointer drag | Reducer with structural sharing, live announcements |
| react 107 | Nested comments with optimistic reply | Tree from flat list, optimistic swap, depth cap |
| react 108 | Date range picker | Grid ARIA, month math, hover preview |
| react 109 | JSON tree viewer with search | Lazy flatten, roving tabindex, large arrays |
| react 110 | Connect Four | Game state reducer, O(1) win check, undo |
| react 111 | Job board feed over a two-step API | Concurrency pool, ordering, per-item retry |
| react 020, 027, 028, 029, 030, 032 | Infinite feed, tabs, accordion, modal, dropdown, toasts | The older classics |

## Block 3 — AI product UI (all four; many departments)

| Warm-up | Build | Why |
| --- | --- | --- |
| async_patterns 007 async generator, algo 081 paginated fetcher | react 068 streaming transcript → 074 SSE parser → 076 streaming markdown | Streaming chain: consume → parse → render |
| algo 082 fiber tree walk | react 077 stick-to-bottom log, 075 reconnecting event source | Scroll + reconnect around the stream |
| algo 090 event-sourced campaign | react 078 agent event reducer → 079 approval gate → 080 cancel/resume | Event-driven state, exactly-once, run-id guards |
| — | react 073 agent run timeline (capstone redo) | Combines everything above |

## Block 4 — Tooling apps (Apple ASE, Netflix practicals) + project evenings 2–4

| Warm-up | Build | Project evening |
| --- | --- | --- |
| js_utilities 017 memoize, algo 089 LRU query cache | react 092 mini React Query | **Evening 2 — data layer** |
| algo 088 journey cycle check | react 093 mini router | **Evening 3 — router** |
| algo 083 rule tree evaluate, 084 audience set ops | react 094 segment builder | **Evening 4 — audience** |
| algo 085 template tokenizer | react 095 template editor | — |
| `node_netflix` 001–007 (parsers, dependency graphs) | react 101 approval grid | — |

## Block 5 — Architecture, performance, a11y signals + project evenings 5–7

| Warm-up | Build | Project evening |
| --- | --- | --- |
| js_utilities 028/029 timers, algo 086 cron next run, 087 quiet hours | react 096 schedule picker | **Evening 5 — content** |
| — | react 099 micro-frontend shell, 100 feature flags, 090 mini store | **Evening 6 — schedule** |
| dom_and_browser 004 event delegation | react 098 channel tabs + tokens, 026 flexible input | **Evening 7 (stretch) — journey** |
| js_utilities 020 deep equal (what `memo` actually compares) | react 040–044 render/memo labs (10 min each), 046 lazy panel, 045 / 087 virtual lists | — |
| — | react 089 URL state, 038 row selection, 088 data grid | — |

## Block 6 — DSA refresh (Google; Apple sometimes)

Pure TypeScript, 20 minutes each, narrate complexity. From `algo/TASKS.md` Tier 1:
- Trees: 032 depth, 033 render order, 037 iterative traversal, 038 LCA, 040 diameter, 041 duplicate subtrees
- Graphs: 044 reachability, 047 permission reach, 052/053 build order (Kahn + DFS), 057 cycle reporter
- Sliding window / two pointers: 012 longest unique run, 015 min coverage window, 019 pair sum, 025 event timeline
- Intervals: 026 merge busy slots, 027 insert meeting, 029 min rooms
- Stacks/queues: 058 bracket validator, 061 ring buffer, 065 sliding max
Then Tier 2 Topics 11–14 (binary search, heaps, linked lists, caches) if a Google loop is confirmed.

## Block 7 — Frontend system design and behavioural (talk only)

**Framework (RADIO):** Requirements → Architecture (components, data flow) → Data model → Interface (API contracts) → Optimisations (perf, a11y, offline, i18n). Spend 5 minutes on requirements, draw the component tree and the data flow, name the hard problem, then go deep on one or two optimisations.

Worked prompts to prepare (15 minutes each, out loud):
1. News feed with infinite scroll and optimistic likes (normalised store, virtualisation, cursor paging).
2. Typeahead / autocomplete as a shared service (debounce, cache, abort, ranking, a11y).
3. Chat / messaging UI (WebSocket vs SSE, optimistic send, ordering, offline queue).
4. Streaming AI assistant UI (token streaming, stop/regenerate, markdown safety, run history) — the AI angle.
5. Image carousel / media gallery at scale (lazy loading, prefetch, LQIP, CLS budget).
6. Internal admin console with role-based access and micro-frontends (shell, routing, shared state, versioning).

**Behavioural:** Apple ownership and design-partnership stories; Netflix culture memo vocabulary; Google "Googleyness" (ambiguity, collaboration, bias to action); Meta impact and conflict stories. Collect 6 stories (ownership, conflict, failure, ambiguity, mentoring, performance win) from GitLab work and map each to all four vocabularies.

## Stretch — Annotation interfaces (if time)

react 070 label hotkeys, 071 span labeler, 081 overlaps, 082 command history, 084 review queue lease, 085 autosave conflict editor, 086 suggestions panel, 083 bbox annotator.

---

## Talk topics (two-sentence answer plus one real example each)

| Topic | Be ready to explain | Evidence |
| --- | --- | --- |
| JS fundamentals | Event loop (micro vs macro tasks), closures and `this`, prototype chain, `==` vs `Object.is`, modules | js_utilities 008, 014, 020, 026 |
| Race conditions and cancellation | Ignore flag vs AbortController; cleanup runs before every re-run | react 006, 012, 014 |
| SSE vs WebSocket vs polling | One-way + auto-reconnect vs bidirectional + own heartbeat vs terminal-state jobs | react 022, 074, 075 |
| React Query mental model | Keyed cache, stale-while-revalidate, dedupe, invalidation, optimistic rollback | react 092, algo 089 |
| Router design | Ranking static > param > wildcard, nested outlets, URL as state | react 093, 089 |
| Micro-frontends | Runtime import maps vs module federation, per-remote boundaries, shared deps | react 099 |
| State modelling | Discriminated unions, reducers, normalised stores, derive don't duplicate | react 018, 034, 037, 078 |
| Re-render control | What triggers a render, memo at measured boundaries, useSyncExternalStore selectors | react 040–044, 090, 100 |
| Core Web Vitals / bundles | LCP, INP, CLS levers; code splitting + preload on intent; budgets in CI | react 046 |
| Testing strategy | RTL at the boundary, mock fetch not hooks, fake timers, Playwright for journeys | every task |
| Accessibility | Roles before test ids, focus management, live regions, roving tabindex vs activedescendant | react 024, 027, 029, 098, 102–109 |
| REST vs GraphQL, BFF | Over-fetching vs caching/N+1; when a BFF earns its keep | `faang_questions/node` |
| Event-driven architecture | Idempotency by id, ordering by seq, replay, snapshots + deltas | react 069, 078; algo 090 |
| Design systems | Tokens, compound components, controlled/uncontrolled, flagging pattern breaks | react 026, 027, 098 |
| AI-assisted coding | Generated tests as grader, hand-solved stubs, reviewing generated code | this repo |

## Interview habits (every task)

1. State shape first — the discriminated union before any JSX.
2. Name the race or cleanup hazard before writing the effect.
3. One data-shape question, one failure-handling question, then state assumptions.
4. Name the first test you would write.
5. Mention accessibility and privacy unprompted.
6. Prettier before "done": no `if(`, no missing semicolons, no leftover `console.log`.

---

*Frontend Interview Plan · Artur Fedorov · Generated by Claude*
