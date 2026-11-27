# Frontend / UI Engineer Interview Plan

**Targets, in priority order:** Meta (Software Engineer, Product, London — Block 9) → Netflix → Apple → Google. Written 2026-11-13, reordered 2026-11-27.
The earlier AIML Annotation Platform loop is closed; its tasks stay because AI product UI (streaming,
long-running agent runs, approval flows) is now asked across many departments at all four companies.

**How this plan works.** A sequence, not a calendar — you set the pace. Each block mixes a short warm-up
(pure TypeScript or JS fundamentals, 15–30 min), a build (30–60 min) and, from block 4, one evening of the multi-evening project.
Tests are the grader; a task is done when its suite is green from a blank file. Anything solved with hints goes
back in the queue for a redo a week later. Status of every task: run its suite (`npx jest <folder>`).

**Algo track.** Blocks 1–5 each carry an algo table covering the same seven topics (arrays/hashing, sliding window and
two pointers, intervals, stacks/queues, trees, graphs, async). Difficulty climbs block to block: Block 1 is Very Easy/Easy
(the Netflix bar), Block 2 Easy/Medium, Block 3 Medium, Block 4 Medium/Hard, Block 5 Hard, Block 6 is timed redos. Take
one or two algo tasks per sitting next to the build. Every `algo/` folder has a `solution.ts` reference — open it only
after the suite is green or after a 25-minute stall. All `algo/` stubs were reset to blank on 2026-11-20.

**Where things live**
- `algo/<NNN>_*` — pure TS (`algo/TASKS.md`: Topics 1–8 DSA, 9 async, 10 marketing utilities)
- `frontend/javascript_utilities`, `frontend/async_patterns`, `frontend/dom_and_browser` — JS fundamentals
- `frontend/faang_questions/react/<NNN>_*` — React tasks; `react/apple-loop-deep-coding-tasks.md` is the catalog for 074–111
- `frontend/react_apps/campaign_studio` — multi-evening project; milestone 1 given, you build 2–7
- `frontend/faang_questions/node_netflix` — Netflix-style parser/tooling practicals

**What each company's loop weights** (from the postings and past rounds in this repo)

| Company | Coding rounds look like | Weight in this plan |
| --- | --- | --- |
| Netflix | Per a current Netflix UI engineer (Nov 2026): LeetCode-easy only, ordinary recursion; emphasis on React with a small real-life task; emphasis on core JS — async operations and functional programming; plus an **AI round** where you code with an agent and are judged on best practices. Culture memo ("Dream Team", "Informed Captain"). UI openings are rare, so be ready when one appears. | Blocks 0, 1, 2 (classics), 3, 8, `node_netflix`, 7 (Talent Tech role on freeze) |
| Apple | Practical component builds in CoderPad/loop (async, state, a11y), JS fundamentals questions woven into the conversation (closures, `this`, event loop, promises), design-system and architecture discussion, team-specific domain (ASE: React Query, router, MFE, event-driven) | Blocks 0, 1, 3, 4, 5 |
| Google | 1 DSA round even for frontend (trees, graphs, sliding window, intervals), 1–2 UI rounds building a widget from scratch with a11y, 1 frontend system design, behavioural ("Googleyness") | Blocks 1, 2, 6, 7 |
| Meta | **Software Engineer, Product — London (referral, Nov 2026):** LeetCode round(s) — two Mediums in ~40 min — plus an AI-enabled coding round (multi-file project with an AI assistant), behavioural. Frontend roles add a pure-JS screen and a UI widget. | **Block 9**, then 6, 8, 7 |

---

## Block 0 — JS fundamentals (Netflix core-JS round, Apple conversation, Meta phone screen)

Pure TypeScript, 15–25 minutes each, no React. Do one as the warm-up of every sitting in blocks 1–5; the first row of each table below is the suggested pairing. The point is fluency: talk through `this`, closures, the microtask queue and timer semantics while typing. Status: run the suite (older stubs return a never-settling promise, so grep won't tell you).

| Theme | Tasks (in order) | What to be able to say |
| --- | --- | --- |
| Timing and closures | js_utilities 001 debounce (redo from blank), 015 throttle, 016 once, 017 memoize, 028 setInterval via setTimeout, 029 clear all timers; dom_and_browser 009 rAF throttle | Leading vs trailing edge, cancel/flush, closure over timer id, `this` and args forwarding |
| Promises and the event loop | js_utilities 010 all, 011 race, 012 allSettled, 013 any, 014 custom Promise (redo); async_patterns 004 sleep (abortable), 005 sequential vs parallel, 006 lazy promise, 010 promisify | Microtasks vs macrotasks, then-chaining, `AggregateError`, thenable assimilation, why `await` in a loop serialises |
| Async orchestration | async_patterns 001 concurrency limiter, 002 retry with backoff, 003 cancelable promise, 007 async generator, 008 rate limiter, 009 batch requests, 011 paginated fetcher | Pool vs batch, settle-then-schedule, jitter, `for await`, abort propagation |
| Functions and `this` | js_utilities 008 bind, 009 call/apply, 018 curry, 023 object assign, 024 object create | Explicit vs implicit binding, arrow functions, partial application, prototype chain |
| Functional programming (Netflix) | js_utilities 031 compose/pipe, 032 partial with placeholder, 033 groupBy, 034 chunk/zip, 035 immutable setIn/updateIn, 036 deepFreeze, 037 reduce-only toolkit, 038 pure-function audit; then 018 curry and 017 memoize again | Purity and referential transparency, immutability with structural sharing, higher-order functions, composition vs inheritance, why reducers must not mutate, point-free when it helps and when it hurts |
| Arrays and objects | js_utilities 002–007 array methods, 005 / 030 flat (recursive and iterative), 019 deep clone, 020 deep equal, 021 JSON stringify, 022 JSON parse, 025 keys/values/entries, 027 string trim | Sparse arrays and holes, cycles in clone/equal, Dates and `NaN` in equality, recursion vs explicit stack |
| Events and DOM | js_utilities 026 event emitter; dom_and_browser 001–003 selectors, 004 event delegation, 005 flatten DOM tree, 006 serialize, 007 virtual DOM diff, 008 MutationObserver, 010 tree builder | Bubbling vs capture, `closest`, tree traversal order, keyed diffing, observer batching |

Solved at least once: js_utilities 001, 008, 010–014, 017, 026; async_patterns 002, 003, 006–011 (001 and js 014 were reset to stubs on purpose). Before any phone screen, redo from a blank file: 001 debounce, 010 all, 014 custom Promise, async 001 limiter, 026 event emitter. Everything else is first-pass.

## Block 1 — Async foundations (all four)

| Warm-up (algo / JS) | Build (React) | Why |
| --- | --- | --- |
| js_utilities 010 all, 011 race (redo from blank), algo 074 sequential vs parallel | react 005 fetch states → 006 race-free search | The race is the single most common loop prompt |
| async_patterns 003 cancelable, 004 sleep, algo 066 timeout, 075 lazy promise, 076 cancelable promise | react 012 useFetch, 014 useAsync | Same race as hooks; stable identities, stale closures |
| js_utilities 017 memoize, algo 067 in-flight dedupe, 070 stale-while-revalidate | react 018 async states panel | Discriminated unions, impossible states |
| async_patterns 002 retry, 001 limiter, 008 rate limiter, algo 077 retry backoff, 078 concurrency pool, 079 token bucket | react 022 polling widget, 021 retry panel, 112 download export button | Settle-then-schedule, backoff, terminal states; async job → poll → download once |
| js_utilities 001 debounce, 015 throttle, algo 080 request batcher, 011 request rate alarm | react 010 useDebouncedValue → 024 autocomplete | Debounce + abort + combobox a11y |

**Algo track — Very Easy / Easy** (15–20 min each; this is the whole Netflix DSA bar, so aim for clean code and stated complexity, not speed)

| Topic | Tasks (in order) | Pattern to name out loud |
| --- | --- | --- |
| Arrays and hashing | algo 001 fixed buffer, 002 first unique event, 003 dynamic array, 004 undo history | Map keeps insertion order; amortised O(1) push from doubling |
| Sliding window | algo 009 moving average, 010 busiest period | Fixed window: add the new, subtract the old |
| Two pointers | algo 017 dedupe subscribers, 018 merge sorted logs, 019 gift card pair, 084 audience set ops | Read/write pointers, parallel pointers, converging pointers on sorted input |
| Intervals | algo 024 double booking, 025 event timeline, 026 merge busy slots | Sort by start, compare with the previous; multi-key comparators |
| Stacks | algo 058 bracket validator, 059 undo/redo | Last-in-first-out matching; a new action clears redo |
| Trees | algo 032 component depth, 033 render order, 083 rule tree evaluate | Recursion = return value from children; pre/in/post order |
| Graphs | algo 043 service map, 051 has dependency | Adjacency list from edges; DFS with a visited set |
| Async | algo 066, 074–080 (in the warm-up column above) | Promise construction, results in input order, timers that are always cleared |

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

**Algo track — Easy / Medium** (20 min each; several pair with a widget above)

| Topic | Tasks (in order) | Pattern to name out loud |
| --- | --- | --- |
| Arrays and hashing | algo 005 filename grouper, 006 image row rotate, 007 sparse grid | Canonical map keys; reversal trick for in-place rotation; `"r,c"` keys for sparse storage |
| Sliding window | algo 011 request rate alarm, 012 longest unique run | Queue-based time window; variable window with a set |
| Two pointers | algo 020 archive completed, 021 typed input compare, 022 calendar intersection | Stable in-place partition; walking from the end; interval two-pointer walk |
| Intervals | algo 027 insert meeting | Three phases: before, overlapping, after |
| Stacks and queues | algo 060 path normalizer, 061 log ring buffer | Stack of segments; `% capacity` instead of shifting |
| Trees | algo 034 level snapshot, 035 folder sizes (pairs with react 102), 036 symmetric layout check | BFS by level; post-order aggregation; twin-cursor recursion |
| Graphs | algo 045 rack outage clusters (pairs with react 110), 052 build order (Kahn) | Grid as an implicit graph; in-degrees + queue |
| Async | algo 068 async queue (pairs with react 111) | Promise chain as a serial queue; one failure must not stall it |

## Block 3 — AI product UI (all four; many departments)

| Warm-up | Build | Why |
| --- | --- | --- |
| async_patterns 007 async generator, algo 081 paginated fetcher | react 068 streaming transcript → 074 SSE parser → 076 streaming markdown | Streaming chain: consume → parse → render |
| algo 082 fiber tree walk | react 077 stick-to-bottom log, 075 reconnecting event source | Scroll + reconnect around the stream |
| algo 090 event-sourced campaign | react 078 agent event reducer → 079 approval gate → 080 cancel/resume | Event-driven state, exactly-once, run-id guards |
| — | react 073 agent run timeline (capstone redo) | Combines everything above |

**Algo track — Medium** (20–25 min each)

| Topic | Tasks (in order) | Pattern to name out loud |
| --- | --- | --- |
| Sliding window | algo 013 error variety window, 014 bandwidth burst | At most k distinct with a count map; shrink while the sum still meets the target |
| Two pointers | algo 023 capacity triplet | Sort, pin one, converge the other two, skip duplicates |
| Intervals | algo 028 free gaps, 029 min rooms | Inverse of merging; sweep line or heap of end times |
| Stacks and queues | algo 062 queue from stacks, 063 build speed watch | Amortised O(1) dequeue; monotonic stack for next-greater |
| Trees | algo 037 iterative traversal, 039 minimap view | Explicit stack instead of recursion; last node per level |
| Graphs | algo 044 router reachability, 046 intro path, 047 permission reach | Build edges from geometry; BFS + parent map for the path; multi-source, cycle-safe |
| Async | algo 069 circuit breaker (pairs with react 075), 072 cancellable pipeline (pairs with react 080) | State machine with an injected clock; abort propagation with cleanup in `finally` |

## Block 4 — Tooling apps (Apple ASE, Netflix practicals) + project evenings 2–4

| Warm-up | Build | Project evening |
| --- | --- | --- |
| js_utilities 017 memoize, algo 089 LRU query cache | react 092 mini React Query | **Evening 2 — data layer** |
| algo 088 journey cycle check | react 093 mini router | **Evening 3 — router** |
| algo 083 rule tree evaluate, 084 audience set ops | react 094 segment builder | **Evening 4 — audience** |
| algo 085 template tokenizer | react 095 template editor | — |
| `node_netflix` 001–007 (parsers, dependency graphs) | react 101 approval grid | — |

**Algo track — Medium / Hard** (25 min each)

| Topic | Tasks (in order) | Pattern to name out loud |
| --- | --- | --- |
| Arrays | algo 008 time series downsample | Bucket boundaries without drift; min/max/avg in one pass |
| Sliding window | algo 015 min coverage window | Need/have counts; shrink only while the window is valid |
| Sorting | algo 030 stable table sort | Merge sort and why stability matters for multi-column sorts |
| Stacks | algo 064 formula calculator (pairs with algo 085 tokenizer) | Two stacks or recursive descent; precedence and parentheses |
| Trees | algo 038 common container, 040 component diameter | LCA by returning found nodes up; combine the two deepest child paths |
| Graphs | algo 048 outage spread, 053 build order (DFS three-colour), 054 parallel stages, 055 migration order | Multi-source BFS by minute; white/grey/black cycle detection; level-based Kahn; heap for deterministic ties |
| Async | algo 071 priority job runner (pairs with react 092) | Concurrency pool where the queue is a heap |

## Block 5 — Architecture, performance, a11y signals + project evenings 5–7

| Warm-up | Build | Project evening |
| --- | --- | --- |
| js_utilities 028/029 timers, algo 086 cron next run, 087 quiet hours | react 096 schedule picker | **Evening 5 — content** |
| — | react 099 micro-frontend shell, 100 feature flags, 090 mini store | **Evening 6 — schedule** |
| dom_and_browser 004 event delegation | react 098 channel tabs + tokens, 026 flexible input | **Evening 7 (stretch) — journey** |
| js_utilities 020 deep equal (what `memo` actually compares) | react 040–044 render/memo labs (10 min each), 046 lazy panel, 045 / 087 virtual lists | — |
| — | react 089 URL state, 038 row selection, 088 data grid | — |

**Algo track — Hard** (30 min each; Google-level, skip for a Netflix-only loop)

| Topic | Tasks (in order) | Pattern to name out loud |
| --- | --- | --- |
| Tree + window | algo 016 search highlight (your Google question) | DFS to a word stream tagged with node ids, then match the query across node boundaries |
| Intervals | algo 031 team free time | Merge k calendars, then find the gaps |
| Deques | algo 065 sliding max latency | Monotonic deque; each index enters and leaves once |
| Trees | algo 041 duplicate subtrees, 042 layout clipboard | Canonical serialisation as a map key; round-trip with null markers |
| Graphs | algo 049 shift split, 050 badge access path, 056 spreadsheet recalc, 057 cycle reporter | Bipartite colouring over every component; BFS over (position, doors used); topo sort of the affected subgraph; recover the cycle from the DFS stack |
| Async | algo 073 dependency task runner | Kahn + concurrency pool: start each task the moment its last dependency settles |

## Block 6 — DSA under the clock (Google; Apple sometimes; Netflix needs only the Block 1 algo track and the recursion rows)

Everything here is a **redo from a blank file** of a task already solved in Blocks 1–5, now timed like a real round: 45 minutes for two problems, one Medium then one Hard, narrating brute force → target complexity → code → tests. For Netflix, Block 1's algo track plus Block 0 recursion (deep clone, flatten, JSON) is enough.

| Mock | Medium (20 min) | Hard (25 min) |
| --- | --- | --- |
| M1 — windows | algo 012 longest unique run | algo 015 min coverage window |
| M2 — intervals | algo 027 insert meeting | algo 031 team free time |
| M3 — trees | algo 037 iterative traversal | algo 041 duplicate subtrees |
| M4 — graphs | algo 046 intro path | algo 050 badge access path |
| M5 — dependency graphs | algo 053 build order (DFS) | algo 057 cycle reporter |
| M6 — stacks and deques | algo 063 build speed watch | algo 065 sliding max latency |
| M7 — async | algo 078 concurrency pool | algo 073 dependency task runner |
| M8 — your real questions | algo 044 router reachability | algo 016 search highlight |

Then Tier 2 Topics 11–14 (binary search, heaps, linked lists, caches) if a Google loop is confirmed. Those are listed in `algo/TASKS.md` (091+) but have no folders yet — ask for them to be scaffolded first.

## Block 7 — Frontend system design and behavioural (talk only)

**Framework (RADIO):** Requirements → Architecture (components, data flow) → Data model → Interface (API contracts) → Optimisations (perf, a11y, offline, i18n). Spend 5 minutes on requirements, draw the component tree and the data flow, name the hard problem, then go deep on one or two optimisations.

Worked prompts to prepare (15 minutes each, out loud):
1. News feed with infinite scroll and optimistic likes (normalised store, virtualisation, cursor paging).
2. Typeahead / autocomplete as a shared service (debounce, cache, abort, ranking, a11y).
3. Chat / messaging UI (WebSocket vs SSE, optimistic send, ordering, offline queue).
4. Streaming AI assistant UI (token streaming, stop/regenerate, markdown safety, run history) — the AI angle.
5. Image carousel / media gallery at scale (lazy loading, prefetch, LQIP, CLS budget).
6. Internal admin console with role-based access and micro-frontends (shell, routing, shared state, versioning).

**Behavioural:** Netflix culture memo vocabulary first (candour, context not control, freedom and responsibility, Informed Captain); Apple ownership and design-partnership stories; Google "Googleyness" (ambiguity, collaboration, bias to action); Meta impact and conflict stories. Collect 6 stories (ownership, conflict, failure, ambiguity, mentoring, performance win) from GitLab work and map each to all four vocabularies.

## Block 8 — AI pairing round (Netflix; spreading elsewhere)

The round: you share a screen, drive a coding agent (Claude Code, Cursor or whatever they provide) on a small feature, and are judged on *how* you work, not on typing speed. Signals they look for: a crisp brief, a plan before code, reading every diff, insisting on tests, catching the agent's mistakes, small commits, and knowing when to stop delegating and write the line yourself.

**Protocol (narrate each step out loud)**
1. **Brief** — restate the task in your own words, name constraints (a11y, no new deps, existing patterns) and the acceptance test. Write it as the first prompt.
2. **Plan first** — ask for a plan and file list, not code. Push back on anything that touches files it should not.
3. **Smallest slice** — have it implement one slice with a test. Read the diff line by line before running anything.
4. **Verify** — run the tests yourself; when a test fails, decide whether the test or the code is wrong before asking the agent.
5. **Review like a colleague** — ask for the trade-offs it made; check for hallucinated APIs, swallowed errors, missing cleanup, `any`, mutated props.
6. **Refactor and commit** — ask for a focused cleanup, then commit with a message you wrote.
7. **Retro** — say what you would have done differently and where the agent saved or cost time.

**Rehearsals** (45 min each, timer on, record yourself once)

| Rehearsal | Material | What to practise |
| --- | --- | --- |
| R1 | `campaign_studio` milestone 02 data layer, built with the agent from the README | Brief + plan + slice loop; refuse code before plan |
| R2 | react 103 image carousel from its README with the agent | Catching a11y and timer-cleanup mistakes in generated code; demanding the senior tests pass |
| R3 | Pick one green task (e.g. 024 autocomplete) and ask the agent to add a feature the README lists as a follow-up | Reviewing a diff against an existing codebase; keeping scope tight |
| R4 | Give the agent a deliberately vague brief for 022 polling and let it go wrong | Practising recovery: diagnose, re-brief, bisect the diff |

**Say out loud during the round:** "I'll ask for a plan first", "let me read this diff before we run it", "this test is asserting the wrong thing, the code is right", "I'd write this line myself, it's faster than explaining", "let's commit this slice before the next one".

## Stretch — Annotation interfaces (if time)

react 070 label hotkeys, 071 span labeler, 081 overlaps, 082 command history, 084 review queue lease, 085 autosave conflict editor, 086 suggestions panel, 083 bbox annotator.

## Block 9 — Meta Software Engineer, Product (London; referral)

**Status:** active target (Netflix Talent Tech is on freeze). Posting: **Software Engineer, Product — London, UK** (Engineering). Rounds below come from the referrer (27 Nov 2026) plus Meta's public loop format; confirm the level and rounds with the recruiter.

**What the posting signals**
- **Product engineering, not infrastructure:** "build new features… across mobile devices and web applications", "implement custom user interfaces", work with product, design and operations. Your frontend depth is an asset here, so it belongs in the design and behavioural rounds.
- **Senior scope:** "set direction and goals for teams, lead major initiatives, mentor, onboard", "drive large efforts to reduce technical debt", "establish ownership… with expert end-to-end understanding". Expect the bar for E5 (senior) and stories at that scale.
- **Data-driven:** "utilizing data and analysis to explain technical problems" — have numbers in your stories (latency, error rates, adoption, time saved).
- **AI is now a stated qualification:** "integrate AI tools to optimize/redesign workflows and drive measurable impact", "responsible, ethical AI practices", "prompt/context engineering, agent orchestration". This lines up with the AI-enabled coding round and needs its own behavioural story.
- Languages: any is fine for coding rounds; JavaScript/TypeScript is listed.

**What the loop looks like**
- **LeetCode round** (screen and onsite): typically **two Mediums in ~40 minutes**, often without running the code. Speed and a clean first draft matter more than cleverness. Expect a follow-up twist on each ("now as a stream", "now O(1) space", "now with negative numbers").
- **AI-enabled coding round:** a HackerRank/CoderPad-style multi-file project with an AI assistant available. Several stages (understand the code, implement a feature, fix failing tests, extend). Judged on problem solving, code quality and how you verify what the AI writes — not on whether you use it.
- **Product architecture design** (for Product SWE at senior level, instead of distributed-systems design): design a user-facing feature end to end — client, API, data model, pagination, real-time updates, scale. See section 4.
- **Behavioural:** conflict, ambiguity, impact, growth, leading without authority — reuse the six stories from Block 7 and add the ones in section 5.
- Referrer's read: "not very hard if you solve LeetCode well".

**Rules for every LeetCode session**
1. Two problems, 40 minutes, timer on, no running code until you have dry-run one example by hand out loud.
2. Say brute force + complexity in one sentence, then the target, then code.
3. After green: answer the follow-up in the README out loud.
4. JavaScript has **no built-in heap or deque** — be able to write a 25-line binary heap from memory (the algo 055 solution has one).

**1. Already in the repo — the LeetCode classic each task really is** (redo from blank, 20 min each)

| LeetCode | Repo task | Pattern |
| --- | --- | --- |
| 49 Group Anagrams | algo 005 filename grouper | Canonical key |
| 189 Rotate Array | algo 006 image row rotate | Three reversals |
| 346 Moving Average from Data Stream | algo 009 moving average | Ring buffer |
| 3 Longest Substring Without Repeating | algo 012 longest unique run | Variable window + set |
| 340 At Most K Distinct Characters | algo 013 error variety window | Window + count map |
| 76 Minimum Window Substring | algo 015 min coverage window | Need/have counts |
| 88 Merge Sorted Array | algo 018 merge sorted logs | Merge from the back for in-place |
| 167 Two Sum II / 15 3Sum | algo 019 gift card pair, 023 capacity triplet | Converging pointers |
| 283 Move Zeroes | algo 020 archive completed | Read/write pointers |
| 844 Backspace String Compare | algo 021 typed input compare | Walk from the end |
| 986 Interval List Intersections | algo 022 calendar intersection | Two-pointer over intervals |
| 56 Merge Intervals / 57 Insert Interval | algo 026, 027 | Sort + sweep |
| 253 Meeting Rooms II | algo 029 min rooms | Sweep line or heap |
| 102 Level Order / 199 Right Side View | algo 034 level snapshot, 039 minimap view | BFS by level |
| 236 Lowest Common Ancestor | algo 038 common container | Return found nodes up |
| 543 Diameter of Binary Tree | algo 040 component diameter | Height + global best |
| 297 Serialize and Deserialize Binary Tree | algo 042 layout clipboard | Pre-order with null markers |
| 200 Number of Islands | algo 045 rack outage clusters | Grid DFS/BFS |
| 785 Is Graph Bipartite | algo 049 shift split | Two-colouring |
| 207/210 Course Schedule I/II | algo 052, 053 build order | Kahn / DFS three colours |
| 20 Valid Parentheses | algo 058 bracket validator | Stack |
| 71 Simplify Path | algo 060 path normalizer | Stack of segments |
| 739 Daily Temperatures | algo 063 build speed watch | Monotonic stack |
| 227/224 Basic Calculator II/I | algo 064 formula calculator | Stack / recursive descent |
| 239 Sliding Window Maximum | algo 065 sliding max latency | Monotonic deque |
| 146 LRU Cache | algo 089 LRU query cache | Map in insertion order |

**2. Meta favourites added as `algo/meta/001–047`** (LeetCode-style statements, tests + `solution.ts` like the rest; per-task order and patterns in `algo/CURRICULUM.md` Stage B)

| Topic | Problems |
| --- | --- |
| Strings | 680 Valid Palindrome II, 1249 Minimum Remove to Make Valid Parentheses, 408 Valid Word Abbreviation, 791 Custom Sort String, 415 Add Strings, 31 Next Permutation, 50 Pow(x, n) |
| Prefix sums and hashing | 560 Subarray Sum Equals K, 523 Continuous Subarray Sum, 528 Random Pick with Weight, 1570 Dot Product of Sparse Vectors, 1762 Buildings With an Ocean View, 1004 Max Consecutive Ones III, 380 Insert Delete GetRandom O(1) |
| Binary search | 162 Find Peak Element, 1539 Kth Missing Positive Number, 34 First and Last Position, 33 Search in Rotated Sorted Array |
| Heaps and selection | 215 Kth Largest Element (quickselect + heap), 973 K Closest Points to Origin, 347 Top K Frequent Elements, 23 Merge k Sorted Lists |
| Linked lists | 138 Copy List with Random Pointer, 708 Insert into a Sorted Circular Linked List, 2 Add Two Numbers |
| Trees | 314 Binary Tree Vertical Order Traversal, 1650 LCA III (parent pointers), 938 Range Sum of BST, 129 Sum Root to Leaf Numbers, 426 BST to Sorted Doubly Linked List, 124 Binary Tree Maximum Path Sum |
| Graphs | 1091 Shortest Path in Binary Matrix, 133 Clone Graph, 721 Accounts Merge (union-find), 827 Making a Large Island, 339 Nested List Weight Sum |
| Backtracking and light DP | 78 Subsets, 46 Permutations, 17 Letter Combinations, 139 Word Break, 301 Remove Invalid Parentheses |

Order: Strings → Prefix sums → Binary search → Heaps → Trees → Graphs → Linked lists → Backtracking. Then mock pairs: one problem from section 1 plus one from section 2, 40 minutes.

**3. AI-enabled coding round**

Use the Block 8 protocol (brief → plan → smallest slice → verify → review → commit), with these changes for Meta:
- The codebase is unfamiliar and multi-file: spend the first 5 minutes reading — entry point, data model, existing tests — and say what you found.
- Prompt for small, checkable steps; read every suggestion; run the tests after each stage.
- Write the core algorithm yourself when it is short — interviewers want to see you can, and it is faster than reviewing a wrong one.
- Rehearse on code you did not write: `node_netflix` 001–007, `frontend/react_apps/campaign_studio`, or a fresh scaffolded `algo/meta/` folder with an AI assistant on and a 60-minute timer.

**4. Product architecture design** (45 min, talk + diagram; use the RADIO framework from Block 7, but spend more time on API and data model than on UI components)

| Prompt | Go deep on |
| --- | --- |
| News feed (Facebook / Instagram) | Cursor pagination, ranking vs chronological, fan-out on write vs read, client cache, optimistic likes |
| Comments with nested replies and live updates | Data model for threads, pagination inside threads, WebSocket vs polling, ordering, moderation hooks |
| Messenger / WhatsApp chat | Message ids and ordering, delivery/read receipts, offline queue and retry, idempotent send |
| Instagram Stories or photo upload | Upload flow (pre-signed URLs, resumable chunks), processing jobs, CDN, expiry |
| Notifications | Fan-out, dedupe, user preferences, quiet hours, batching |
| Typeahead search (people, pages) | Prefix index, ranking, debounce + cache on the client, privacy filtering |

Existing material: Block 7 prompts 1–3 and 5, `faang_questions/node` 012 list query semantics (cursor pagination), 014 idempotency keys, react 112 (async job + polling). For each prompt be able to write the core API (`GET /feed?cursor=…`, request/response shapes) and the main tables.

**5. Behavioural — stories this posting asks for**
- Leading a major initiative across teams (set direction, got buy-in, delivered).
- Reducing tech debt or fixing a performance problem, with before/after numbers.
- Raising quality through code review, testing, rollout and monitoring.
- **AI in your workflow with measurable impact** — e.g. building or adopting AI-assisted workflows on the GitLab Security Policies team: what changed, how you measured it, how you kept quality (review, tests, guardrails).
- Mentoring and onboarding someone.

**Lower priority for this loop:** UI widget builds, a11y deep-dives and the Apple/Netflix-specific blocks. Product SWE does build UIs, so keep Block 7 system design and one or two React builds warm, but the LeetCode and AI rounds decide the loop.

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
| Functional programming | Purity, immutability + structural sharing, HOFs, compose/pipe, currying vs partial, reduce as the universal fold | js_utilities 031–038, 017, 018 |
| AI-assisted coding | Brief → plan → slice → verify → review; generated tests as grader; where agents fail (cleanup, a11y, invented APIs) | Block 8, this repo |

## Interview habits (every task)

1. State shape first — the discriminated union before any JSX.
2. Name the race or cleanup hazard before writing the effect.
3. One data-shape question, one failure-handling question, then state assumptions.
4. Name the first test you would write.
5. Mention accessibility and privacy unprompted.
6. Prettier before "done": no `if(`, no missing semicolons, no leftover `console.log`.

---

*Frontend Interview Plan · Artur Fedorov · Generated by Claude*
