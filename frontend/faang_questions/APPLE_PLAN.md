# Apple Prep — Learning Plan

**Roles in play**
1. AIML — Frontend Engineer, Annotation Platform & Agentic UI (Heidelberg). Loop after a passed CoderPad screen. Themes: streaming model output, long-running async, event-driven state, annotation editors, a11y, performance.
2. Apple Services Engineering — Frontend Engineer, Customer Engagement platform (London). Themes: React Query, React Router, design systems / Tailwind-style utilities, micro-frontends, REST + GraphQL, event-driven architecture, CMS integration, TDD, AI-assisted coding.

**How this plan works.** It is a sequence, not a calendar — you set the pace. Each block mixes a short
algorithm warm-up (pure TypeScript, 15–30 min), a React build (30–60 min) and, from block 3, one evening of the
multi-evening project. Tests are the grader everywhere; a task counts as done when its suite is green from a
blank file. Anything solved with hints goes back in the queue for a redo a week later.

**Where things live**
- `algo/<NNN>_*` — pure TS tasks (`algo/TASKS.md` is the catalog; Topic 9 async, Topic 10 marketing utilities)
- `frontend/faang_questions/react/<NNN>_*` — React tasks (`react/apple-loop-deep-coding-tasks.md` is the catalog for 074–101)
- `frontend/javascript_utilities`, `frontend/async_patterns` — JS fundamentals (promise combinators, debounce, event emitter…)
- `frontend/react_apps/campaign_studio` — the multi-evening project; milestone 1 is given, you build 2–7

---

## Block 1 — Async foundations (both roles)

| Warm-up (algo / JS) | Build (React) | Why |
| --- | --- | --- |
| js_utilities 010–013 promise combinators (redo any that feel slow) | react 005 fetch states → 006 race-free search | The race is the single most common loop prompt |
| async_patterns 003 cancelable, algo 066 timeout | react 012 useFetch, 014 useAsync | Same race as hooks; stable identities, stale closures |
| algo 067 in-flight dedupe, 070 stale-while-revalidate | react 018 async states panel | Discriminated unions, impossible states |
| algo 077 retry backoff, 078 concurrency pool | react 022 polling widget, 021 retry panel | Settle-then-schedule, backoff, terminal states |
| js_utilities 001 debounce, 015 throttle (todo) | react 010 useDebouncedValue → 024 autocomplete | Debounce + abort + combobox a11y |

## Block 2 — Agentic UI (AIML loop)

| Warm-up | Build | Why |
| --- | --- | --- |
| algo 074 sequential vs parallel (todo), 081 paginated fetcher (todo) | react 068 streaming transcript → 074 SSE parser → 076 streaming markdown | Streaming chain: consume → parse → render |
| algo 082 fiber tree walk (todo) | react 077 stick-to-bottom log, 075 reconnecting event source | Scroll + reconnect around the stream |
| algo 090 event-sourced campaign | react 078 agent event reducer → 079 approval gate → 080 cancel/resume | Event-driven state, exactly-once, run-id guards |
| — | react 073 agent run timeline (capstone redo, blank file) | Combines everything above |

## Block 3 — Customer engagement tooling (ASE loop) + project evenings 2–3

| Warm-up | Build | Project evening |
| --- | --- | --- |
| algo 089 LRU query cache | react 092 mini React Query | **Evening 2 — data layer**: `useQuery`/`useMutation` + LRU in `milestones/02_data_layer` |
| algo 088 journey cycle check (graph refresher) | react 093 mini router | **Evening 3 — router**: `milestones/03_router`, swap the shell nav to routes |
| algo 083 rule tree evaluate, 084 audience set ops | react 094 segment builder | — |

## Block 4 — Content, schedule, journeys + project evenings 4–6

| Warm-up | Build | Project evening |
| --- | --- | --- |
| algo 085 template tokenizer | react 095 template editor | **Evening 4 — audience**: `milestones/04_audience` (rules + SegmentBuilder) |
| algo 086 cron next run, 087 quiet hours merge | react 096 schedule picker | **Evening 5 — content**: `milestones/05_content` (tokenizer + TemplateEditor) |
| algo 088 journey cycle check (redo) | react 097 journey builder | **Evening 6 — schedule**: `milestones/06_schedule` |
| — | — | **Evening 7 (stretch) — journey**: `milestones/07_journey` (graph + events + JourneyBuilder) |

## Block 5 — Architecture and design-system signals (both roles)

| Warm-up | Build | Why |
| --- | --- | --- |
| — | react 099 micro-frontend shell | Named in the ASE JD; Suspense + boundaries + event bus |
| — | react 100 feature flag context, 090 mini store (useSyncExternalStore) | Selector isolation, render counts, no tearing |
| — | react 098 channel preview tabs, 027 compound tabs, 029 modal portal | ARIA patterns, compound components, design tokens |
| — | react 101 campaign approval grid, 089 URL state filters, 038 row selection | URL-synced paging, selection across pages, optimistic bulk actions |
| — | react 040–044 render/memo labs (fix-the-code, 10 min each) | "Why does this re-render" |

## Block 6 — Annotation interfaces and data-dense UI (AIML loop, if time)

react 070 label hotkeys, 071 span labeler, 081 span labeler with overlaps, 082 command history, 084 review queue lease, 085 autosave conflict editor, 086 suggestions panel, 087 variable-height virtual list, 088 data grid a11y, 083 bbox annotator.

---

## Talk topics (prepare a two-sentence answer plus one real example each)

| Topic | Be ready to explain | Evidence |
| --- | --- | --- |
| Race conditions and cancellation | Ignore flag vs AbortController: flag = correctness, abort = bandwidth; cleanup runs before every re-run | react 006, 012, 014 |
| SSE vs WebSocket vs polling | One-way + auto-reconnect vs bidirectional + own heartbeat vs simple terminal-state jobs; idempotency is the client's job | react 022, 074, 075 |
| React Query mental model | Cache keyed by serialized key, stale-while-revalidate, in-flight dedupe, invalidation, optimistic update + rollback | react 092, algo 089 |
| Router design | Ranking static > param > wildcard, nested outlets, URL as state, auth redirect preserving `from` | react 093, 089 |
| Micro-frontends | Module federation vs runtime import maps, per-remote boundaries, shared context bridge, versioning shared deps | react 099 |
| State modelling | Discriminated unions, reducers for guarded transitions, normalized stores, derive don't duplicate | react 018, 034, 037, 078 |
| Re-render control | What triggers a render, memo at measured boundaries, referential stability, useSyncExternalStore selectors | react 040–044, 090, 100 |
| Core Web Vitals / bundles | LCP, INP, CLS levers; code splitting + preload on intent; budgets in CI | react 046 |
| Testing strategy | RTL at the component boundary, mock fetch not hooks, fake timers, Playwright for a few journeys; TDD flow | every task here |
| Accessibility | Roles before test ids, focus management, live regions, roving tabindex vs aria-activedescendant | react 024, 027, 029, 070, 098 |
| REST vs GraphQL, BFF | Over-fetching vs caching complexity/N+1; when a BFF earns its keep | `frontend/faang_questions/node` |
| Event-driven architecture | Idempotency by event id, ordering by seq, replay after reconnect, snapshots + deltas | react 069, 078; algo 090 |
| Design systems | Tokens, compound components over prop explosion, controlled/uncontrolled, flagging pattern breaks | react 026, 027, 098 |
| AI-assisted coding | This repo: generated tests as grader, hand-solved stubs, reviewing generated code for dead defensiveness | this repo |

## Interview habits (every task)

1. State shape first — write the discriminated union before any JSX.
2. Name the race or cleanup hazard before writing the effect.
3. Ask one data-shape question and one failure-handling question, then state your assumptions.
4. Name the first test you would write.
5. Mention accessibility and privacy unprompted.
6. Prettier before "done": no `if(`, no missing semicolons, no leftover `console.log`.

---

*Apple Prep Learning Plan · Artur Fedorov · Generated by Claude · plan created 2026-11-12*
