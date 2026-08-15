# Algo Practice Tasks — Practical DSA in TypeScript

**Companion to:** [CURRICULUM.md](./CURRICULUM.md) (theory) — this file is the coding side.
**Style:** No LeetCode framing. Every task is a realistic engineering scenario (build tools, editors, networking, monitoring, calendars), the way FAANG actually asks them.
**Language:** TypeScript, pure functions/classes — no browser, no DOM APIs. A "web page" is just a tree object.
**Ordering:** Topics are sorted by **probability of appearing in an interview**, weighted for Netflix first, then Google/Meta/Amazon. Work top to bottom.

---

## How this works

- Each task gets a folder `algo/NNN_task_name/` containing:
  - `README.md` — scenario, examples, constraints (same format as `frontend/netflix/001_semver_parser`)
  - `task_name.test.ts` — full jest test suite (base + edge cases)
  - `task_name.ts` — an exported stub with the right signature and a `// TODO: implement` body. No solution file.
- **Workflow:** solve from the README + stub signature only — that's the interviewer's prompt. The test file is the grader, not the spec: open it only to validate.
- Each README states a **Target** complexity (brute force should fail the large-input test) and one **Interviewer follow-up** to answer out loud after solving.
- Run with `npx jest algo/NNN_task_name` (or `npm test`).
- Every topic is ordered **Very Easy → Hard**. Do them in order inside a topic.
- Difficulty: `VE` Very Easy · `E` Easy · `M` Medium · `H` Hard.
- ⭐ = a question you were actually asked (Google / Netflix).

### Tiers

| Tier | Probability | Meaning |
| ---- | ----------- | ------- |
| 1 | Very High | Shows up constantly; master these before anything else |
| 2 | High | Regular appearances; second pass |
| 3 | Medium | Company/role dependent; third pass |
| 4 | Low | Rarely coded live — do for internals depth alongside CURRICULUM.md theory |

---

# Tier 1 — Very High Probability

## Topic 1: Arrays & Hashing — _Lesson 1_

**Probability: Very High.** The warm-up layer of nearly every interview; hashmap-with-a-twist is the single most common question shape at Netflix and everywhere else.

| #   | Folder                   | Scenario                                                                                                                 | Diff | Done |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 001 | `fixed_buffer`           | Metrics agent buffer: fixed-capacity store with `push`/`get`/`size`, throws when full                                        | VE   |      |
| 002 | `first_unique_event`     | First event id in a log batch that occurs exactly once (map + insertion order)                                                | E    |      |
| 003 | `dynamic_array`          | Implement a growable array class (doubling growth): track `length` vs `capacity`, amortized `push`, expose resize count       | E    |      |
| 004 | `undo_history`           | Editor undo history with max depth: append snapshots, drop oldest when full, jump to snapshot                                | E    |      |
| 005 | `filename_grouper`       | Group file names that are equal up to case and separators (`myFile-v2` ≡ `my_file_v2`) — design the canonical map key         | M    |      |
| 006 | `image_row_rotate`       | Image editor: rotate a row of pixels left/right by k, in place, O(1) extra space (reversal trick)                             | M    |      |
| 007 | `sparse_grid`            | Spreadsheet storage: 2D grid backed by a map, only non-empty cells stored, iterate in row-major order                        | M    |      |
| 008 | `time_series_downsample` | Downsample metric samples into n fixed buckets (min/max/avg per bucket), preserving time order                                | M    |      |

## Topic 2: Sliding Window — _pattern_

**Probability: Very High.** The most common medium-question pattern; includes your Google search-highlight question.

| #   | Folder                 | Scenario                                                                                                                                                | Diff | Done |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 009 | `moving_average`       | CPU monitor: moving average over the last k readings (fixed window, one pass)                                                                                    | VE   |      |
| 010 | `busiest_period`       | Traffic dashboard: which k consecutive hours had the most requests? (fixed window max-sum)                                                                       | E    |      |
| 011 | `request_rate_alarm`   | Streaming timestamps: after each request, report how many arrived in the last 60s (queue-based time window — a rate limiter's core)                              | E    |      |
| 012 | `longest_unique_run`   | Longest streak of consecutive requests with no repeated client id (variable window + set)                                                                        | M    |      |
| 013 | `error_variety_window` | Longest time window containing at most k distinct error codes (variable window + count map)                                                                      | M    |      |
| 014 | `bandwidth_burst`      | Shortest run of consecutive transfers whose total meets the bandwidth cap (min-length window, sum ≥ target)                                                      | M    |      |
| 015 | `min_coverage_window`  | Shortest log window that contains at least one of every required event type (min-window with need/have counts)                                                   | H    |      |
| 016 | `search_highlight`     | ⭐ _Your Google question:_ page = tree of text nodes; given a multi-word query, return ids of nodes whose combined text contains the exact word sequence (tree walk + word-level sliding window across node boundaries) | H    |      |

## Topic 3: Two Pointers — _pattern_

**Probability: Very High.** Cheap to ask, quick to grade — a favorite screening pattern.

| #   | Folder                  | Scenario                                                                                                        | Diff | Done |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 017 | `dedupe_subscribers`    | Deduplicate a sorted email list in place, return new length (read/write pointers)                                        | VE   |      |
| 018 | `merge_sorted_logs`     | Merge two timestamp-sorted log files into one (parallel pointers — no re-sort)                                           | E    |      |
| 019 | `gift_card_pair`        | Store catalog (sorted prices): find two items that exactly spend a gift card (convergent pointers, why sorted matters)   | E    |      |
| 020 | `archive_completed`     | Move completed tasks to the end of the list, keeping active tasks in original order, in place                            | M    |      |
| 021 | `typed_input_compare`   | Are two text inputs equal after applying `#` backspaces? O(1) space — walk both from the end                             | M    |      |
| 022 | `calendar_intersection` | Two people's sorted busy intervals — find all overlapping slots (interval two-pointer walk)                              | M    |      |
| 023 | `capacity_triplet`      | Find three VM instance sizes that sum exactly to the reserved capacity, no duplicate triples (sort + pinned pointer)     | M    |      |

## Topic 4: Intervals & Sorting — _pattern_

**Probability: Very High.** Calendar/meeting problems are a FAANG staple; comparator bugs are a classic screen.

| #   | Folder              | Scenario                                                                                                  | Diff | Done |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 024 | `double_booking`    | Does anyone's calendar contain a double-booking? (sort + adjacent overlap check)                                    | VE   |      |
| 025 | `event_timeline`    | Sort a mixed event feed by multi-key comparator: date asc, then priority desc, then name — get the tie-breaks right | E    |      |
| 026 | `merge_busy_slots`  | Merge overlapping busy slots into a clean availability view (touching intervals merge too)                          | E    |      |
| 027 | `insert_meeting`    | Insert a new meeting into an already-merged calendar and re-merge in one pass                                       | M    |      |
| 028 | `free_gaps`         | Given booked slots and working hours, list every free gap of at least d minutes (the inverse of merging)            | M    |      |
| 029 | `min_rooms`         | Minimum meeting rooms needed for a set of meetings (sweep line or heap of end times)                                | M    |      |
| 030 | `stable_table_sort` | Implement merge sort for a data table where equal keys must keep original row order (why stability matters)         | M    |      |
| 031 | `team_free_time`    | Free slots common to every member across k calendars (merge + gap detection)                                        | H    |      |

## Topic 5: Trees — Traversal & Recursion — _Lesson 4_

**Probability: Very High.** For frontend-leaning interviews the tree IS the product (component trees, file trees) — expect at least one. Includes the combine-children-answers recursion shapes (diameter, duplicate subtrees) Google leans on.

| #   | Folder                   | Scenario                                                                                                          | Diff | Done |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 032 | `component_depth`        | Max nesting depth of a component tree (deep nesting warning for a linter)                                                    | VE   |      |
| 033 | `render_order`           | Return node ids in pre-, in-, and post-order — which order does a renderer mount / unmount?                                  | E    |      |
| 034 | `level_snapshot`         | Group component ids by depth level (BFS) — the data behind a layers panel                                                    | E    |      |
| 035 | `folder_sizes`           | File tree where leaves have sizes — compute total size per folder (post-order aggregation)                                   | E    |      |
| 036 | `symmetric_layout_check` | Is a layout tree mirror-symmetric around its center? (compare two subtrees in opposite order — twin-cursor recursion)        | M    |      |
| 037 | `iterative_traversal`    | Pre/in/post-order **without recursion** — explicit stack (the classic follow-up)                                             | M    |      |
| 038 | `common_container`       | Two elements are selected — find their nearest common ancestor container (LCA)                                               | M    |      |
| 039 | `minimap_view`           | Which component is visible at each depth when the tree is viewed from the right edge? (per-level last node)                  | M    |      |
| 040 | `component_diameter`     | Longest node-to-node chain anywhere in a component tree (combine the two deepest child paths at every node — diameter)       | M    |      |
| 041 | `duplicate_subtrees`     | Find repeated subtrees in a UI tree worth extracting into a shared component (canonical subtree serialization + map)         | H    |      |
| 042 | `layout_clipboard`       | Serialize a layout tree to a string and deserialize it back (copy/paste between documents), round-trip must be exact         | H    |      |

## Topic 6: Graph Traversal — BFS & DFS — _Lesson 14_

**Probability: Very High.** Reachability and grid problems appear across all FAANG; includes your Google router question and state-BFS variants.

| #   | Folder                 | Scenario                                                                                                                                            | Diff | Done |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | ---- |
| 043 | `service_map`          | Build an adjacency list from a list of microservice calls; report in/out degree per service                                                                    | VE   |      |
| 044 | `router_reachability`  | ⭐ _Your Google question:_ routers at coordinates, each with signal range r — can a packet hop from router A to router B? (build graph from proximity + BFS/DFS) | M    |      |
| 045 | `rack_outage_clusters` | A server rack is a 2D grid of ok/failed machines — count contiguous failure clusters (implicit grid graph)                                                     | M    |      |
| 046 | `intro_path`           | Social graph: fewest introductions between two people, and return the actual chain (BFS + parent map)                                                          | M    |      |
| 047 | `permission_reach`     | Which resources can a user reach through nested group memberships? (multi-source traversal, cycle-safe)                                                        | M    |      |
| 048 | `outage_spread`        | A failure spreads to adjacent servers every minute from several starting points — minutes until full impact, and which servers survive (multi-source BFS)      | M    |      |
| 049 | `shift_split`          | Employees with conflicts — can they be split into two shifts with no conflict inside a shift? (bipartite check, disconnected graph)                            | H    |      |
| 050 | `badge_access_path`    | Shortest route through an office grid when your badge can bypass **at most one** locked door (BFS where state = position + bypass-used)                        | H    |      |

## Topic 7: Topological Sort & Dependency Graphs — _pattern; extends netflix 004–007_

**Probability: Very High — Netflix confirmed (your dependency-resolver interview).** The DFS-with-colors approach interviewers actually want.

| #   | Folder              | Scenario                                                                                                                  | Diff | Done |
| --- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 051 | `has_dependency`    | Package manifest: does A depend on B, directly or transitively?                                                                    | VE   |      |
| 052 | `build_order_kahn`  | Order build targets so dependencies build first — Kahn's algorithm (in-degrees + queue)                                            | E    |      |
| 053 | `build_order_dfs`   | ⭐ _Your Netflix question:_ same problem via DFS post-order with three-color (white/gray/black) cycle detection — no Kahn           | M    |      |
| 054 | `parallel_stages`   | Group build targets into stages where everything in a stage can build in parallel (level-based Kahn)                               | M    |      |
| 055 | `migration_order`   | DB migration ordering with deterministic tie-break: among ready migrations, always pick alphabetically first (heap)                | M    |      |
| 056 | `spreadsheet_recalc`| A cell changed — recompute **only affected** cells, in dependency order (topo sort over the reverse-dependency subgraph)           | H    |      |
| 057 | `cycle_reporter`    | Builds fail with "cycle detected" — return one actual cycle path for the error message, not just `true`                            | H    |      |

## Topic 8: Stacks, Queues & Deques — _Lesson 3_

**Probability: Very High.** Path/expression parsing and monotonic-stack questions are perennial.

| #   | Folder                | Scenario                                                                                                          | Diff | Done |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 058 | `bracket_validator`   | Linter check: are `()[]{}` balanced in a config snippet (ignore other chars)                                           | VE   |      |
| 059 | `undo_redo`           | Two-stack undo/redo state manager; a new action clears the redo stack                                                  | E    |      |
| 060 | `path_normalizer`     | Normalize a file path: `/a/./b/../c//d` → `/a/c/d` (stack of segments — what `path.resolve` does)                      | M    |      |
| 061 | `log_ring_buffer`     | Keep the last N log lines: circular buffer with `% capacity`, no shifting, O(1) append                                 | M    |      |
| 062 | `queue_from_stacks`   | Task queue built on two append-only stacks (amortized O(1) dequeue) — like replaying transaction logs                  | M    |      |
| 063 | `build_speed_watch`   | For each daily build, how many days until a strictly faster build? (monotonic stack, next-greater-element)             | M    |      |
| 064 | `formula_calculator`  | Evaluate a spreadsheet formula string `2+3*(4-1)` with a stack (no `eval`)                                             | H    |      |
| 065 | `sliding_max_latency` | Report the max latency over the last N requests as each arrives — monotonic deque, O(1) amortized                      | H    |      |

## Topic 9: Async Orchestration & Scheduling — _pattern (new)_

**Probability: Very High — Netflix's signature round.** Their senior loops probe async coordination harder than pure DSA. Complements the `frontend/GOOGLE.md` Category 4 tasks you've already done (pool, retry, rate limiter) — no duplicates. All testable with jest fake timers / injectable clocks.

| #   | Folder                   | Scenario                                                                                                                      | Diff | Done |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 066 | `timeout_wrapper`        | Wrap any promise with a timeout: reject with `TimeoutError` after t ms, clear the timer on either outcome (no dangling handles)          | E    |      |
| 067 | `in_flight_dedupe`       | Request coalescing: concurrent calls for the same key share one in-flight promise; the entry clears on settle (the fetch-dedupe every app needs) | M | |
| 068 | `async_queue`            | Serial async queue: `enqueue(fn)` returns a promise; tasks run strictly one at a time in arrival order, one failure doesn't kill the queue | M   |      |
| 069 | `circuit_breaker`        | Circuit breaker around a flaky service: closed → open after n consecutive failures, half-open probe after cooldown (injectable clock)     | M    |      |
| 070 | `stale_while_revalidate` | Cache wrapper: serve the stale value instantly, refresh in the background, dedupe concurrent refreshes, propagate refresh errors sanely   | M    |      |
| 071 | `priority_job_runner`    | Concurrency-limited runner where queued jobs start by priority, not arrival order (pool + heap — pairs with Topic 11)                    | M    |      |
| 072 | `cancellable_pipeline`   | Multi-step async pipeline with `AbortSignal`: cancel stops the current step, skips the rest, and cleanup always runs                     | H    |      |
| 073 | `dependency_task_runner` | Run a task graph with max parallelism n — each task starts the moment its dependencies finish (Topic 7 + concurrency pool combined)      | H    |      |

**Repeat drills** — you solved these once in the frontend track (`GOOGLE.md` Category 4 ✅). Re-implement from a blank file against fresh test suites here; retention beats novelty, and these are Netflix's favorite warm-ups.

| #   | Folder                   | Scenario                                                                                                                | Diff | Done |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 074 | `sequential_vs_parallel` | Run async tasks strictly in sequence, fully parallel, and in chunks of k — results always in input order (A5 redo)              | E    |      |
| 075 | `lazy_promise`           | Deferred that starts work only on first `.then`, runs the executor exactly once (A6 redo)                                      | E    |      |
| 076 | `cancelable_promise`     | Wrap a promise to be cancelable via `AbortSignal`: rejects with `AbortError`, cleanup always runs (A3 redo)                     | M    |      |
| 077 | `retry_backoff`          | Retry with exponential backoff + jitter and a max-delay cap, only on retryable errors (A2 redo, injectable timers)              | M    |      |
| 078 | `concurrency_pool`       | Run n async jobs with at most k in flight; one failure doesn't stall the pool; results in input order (A1 redo)                 | M    |      |
| 079 | `token_bucket`           | Rate limiter: capacity, refill rate, `tryAcquire` / awaitable `acquire` (A9 redo, injectable clock)                             | M    |      |
| 080 | `request_batcher`        | Collect calls for t ms (or n max) into one batched request, fan results back out to each caller (A10 redo)                      | M    |      |
| 081 | `paginated_fetcher`      | Async generator over a cursor-paginated API with `take(n)` and next-page prefetch (A11 redo)                                    | M    |      |

---

# Tier 2 — High Probability

## Topic 10: Binary Search — _pattern_

**Probability: High.** Boundary search and search-on-answer are standard mediums/hards.

| #   | Folder               | Scenario                                                                                                        | Diff | Done |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 082 | `find_build`         | Locate a build id in a sorted release list (the classic, done cleanly: no overflow, correct bounds)                   | VE   |      |
| 083 | `first_bad_commit`   | CI bisect: first commit where tests fail, minimizing `isBad()` calls (boundary search on a monotonic predicate)       | E    |      |
| 084 | `nearest_snapshot`   | Backup browser: find the snapshot closest to a requested timestamp (floor/ceiling search)                             | E    |      |
| 085 | `log_time_bounds`    | First and last log index for a timestamp (lower/upper bound — the two off-by-one traps)                               | M    |      |
| 086 | `rotated_log_search` | The log file rotated at midnight so it's sorted-but-rotated — find an entry without re-sorting                        | M    |      |
| 087 | `batch_capacity`     | Min server capacity to process all daily batches within D days, batches in order (binary search on the answer)        | H    |      |
| 088 | `polling_rate`       | Slowest polling rate that still drains every queue before its deadline (search on answer + feasibility check)         | H    |      |

## Topic 11: Heaps & Top-K — _Lessons 12–13_

**Probability: High.** Top-k and k-way merge are among the most-reported mediums; Netflix loves stream-shaped versions.

| #   | Folder                   | Scenario                                                                                                     | Diff | Done |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 089 | `job_min_heap`           | Job scheduler core: min-heap class with `insert` / `peek` / `extractMin` (sift-up / sift-down)                     | E    |      |
| 090 | `bulk_heapify`           | Load 10k pending jobs at once: bottom-up heapify in O(n) — tests verify sift call counts stay linear-ish           | M    |      |
| 091 | `top_k_errors`           | From an error-log stream, keep the k most frequent error codes using a size-k heap (not full sort)                 | M    |      |
| 092 | `k_closest_drivers`      | Dispatch: the k drivers nearest to a pickup point from a live stream of positions (bounded max-heap)               | M    |      |
| 093 | `merge_k_feeds`          | Merge k timestamp-sorted activity feeds into one timeline (heap of cursors)                                        | M    |      |
| 094 | `download_manager`       | Indexed priority queue: reprioritize a queued download by id in O(log n) (decrease-key with position map)          | H    |      |
| 095 | `job_cooldown_scheduler` | Rate-limited worker: same-type jobs need a cooldown of n ticks between runs — minimize total ticks (greedy + heap) | H    |      |
| 096 | `running_median`         | Live p50: report the median response time after every request (two-heap balance)                                   | H    |      |

## Topic 12: Linked Lists — _Lesson 2_

**Probability: High.** Reversal, merging, and cycle detection are staple screening questions at Meta and Amazon — and the doubly linked list you hand-roll here is the engine inside the LRU/LFU caches in the next topic.

| #   | Folder                | Scenario                                                                                                    | Diff | Done |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 097 | `playlist`            | Singly linked playlist: `append`, `prepend`, `find`, `toArray`                                                      | VE   |      |
| 098 | `playlist_remove`     | Remove a track by id — handle head, tail, middle, missing, single-element list                                      | E    |      |
| 099 | `reverse_chain`       | Reverse a migration chain in place (iterative pointer flip — the must-know)                                         | E    |      |
| 100 | `merge_event_streams` | Merge two timestamp-sorted event streams (linked lists) into one sorted stream                                      | E    |      |
| 101 | `browser_history`     | Doubly linked back/forward navigation: `visit` truncates the forward chain                                          | M    |      |
| 102 | `round_robin_workers` | Circular list dispatching jobs across workers; removing a dead worker keeps the rotation intact                     | M    |      |
| 103 | `job_chain_cycle`     | Each job names a `next` job — split a chain at its midpoint (fast/slow), and detect if a chain loops forever        | M    |      |

## Topic 13: Caches & Eviction — _Lessons 21–22_

**Probability: High.** LRU is the most famous design-a-data-structure question in existence; caching questions fit Netflix's practical style perfectly.

| #   | Folder                 | Scenario                                                                                                   | Diff | Done |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 104 | `fifo_cache`           | Simplest eviction: fixed-capacity cache that evicts the oldest inserted key (establishes the cache API contract)   | VE   |      |
| 105 | `cache_stats`          | Wrap any cache and report hit/miss counts and hit ratio (decorator over the shared interface)                      | E    |      |
| 106 | `ttl_cache`            | Config cache with per-key expiry — injectable clock, lazy eviction on read                                         | E    |      |
| 107 | `lru_cache`            | API response cache: O(1) `get`/`put` with capacity eviction (map + doubly linked list, no arrays)                  | M    |      |
| 108 | `multi_tier_cache`     | Two-tier lookup: small fast L1 over a large L2, with promotion on hit and write-through (CDN edge/origin shape)    | M    |      |
| 109 | `lfu_cache`            | O(1) LFU: frequency buckets of doubly linked lists, LRU tie-break within a frequency                               | H    |      |
| 110 | `consistent_hash_ring` | Shard router: hash ring with virtual nodes; tests verify only ~1/n keys remap when a node joins or leaves          | H    |      |

## Topic 14: Tries & Prefix Structures — _Lesson 9_

**Probability: High.** Autocomplete is the single most-asked UI-adjacent algorithm; routers and redaction are its production faces.

| #   | Folder                | Scenario                                                                                                     | Diff | Done |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------ | ---- | ---- |
| 111 | `contact_prefix`      | Contacts app: insert names, count how many start with a prefix                                                       | E    |      |
| 112 | `command_shortcuts`   | CLI ergonomics: shortest unique prefix for every command (`checkout` → `che` if `cherry-pick` exists)                | M    |      |
| 113 | `autocomplete_top_k`  | Search box suggestions: all completions of a prefix, then top-k by usage frequency                                   | M    |      |
| 114 | `wildcard_search`     | Search supporting `?` as a single-character wildcard (`c?t` matches `cat`, `cut`)                                    | M    |      |
| 115 | `ip_prefix_match`     | Router table: longest-prefix match of an IP against CIDR-style binary prefixes (binary trie)                         | M    |      |
| 116 | `transcript_redactor` | Redact any of n banned words from a transcript in a single pass (trie-guided scan, longest match wins)               | M    |      |
| 117 | `radix_compress`      | Build a compressed radix tree from a word list — collapse single-child chains, report node savings vs plain trie     | H    |      |
| 118 | `url_router`          | Express-style router on a radix tree: match `/users/:id/posts` patterns, extract params, static beats param          | H    |      |

## Topic 15: Prefix Sums & Difference Arrays — _pattern_

**Probability: High.** The precompute-once idea behind countless analytics questions.

| #   | Folder                 | Scenario                                                                                                     | Diff | Done |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 119 | `revenue_ranges`       | Daily revenue array + many `[from, to]` queries — O(1) per query after O(n) prep                                       | VE   |      |
| 120 | `pivot_day`            | Find the day where revenue-before equals revenue-after (equilibrium index)                                             | E    |      |
| 121 | `room_occupancy`       | Apply 10k bookings `[start, end, +people]` then report occupancy per hour — difference array, one pass                 | E    |      |
| 122 | `quota_periods`        | Count billing periods whose total usage hits the quota exactly (prefix sum + hashmap of seen sums)                     | M    |      |
| 123 | `pack_aligned_periods` | Count periods whose total usage is an exact multiple of the pack size (prefix sums mod k)                              | M    |      |
| 124 | `heatmap_region`       | Click-tracking heatmap: sum of any rectangular region in O(1) (2D prefix sums)                                         | M    |      |
| 125 | `balanced_growth`      | Longest period where signups and cancellations were equal (transform to ±1, prefix + first-seen index map)             | H    |      |

## Topic 16: Greedy — _pattern (new)_

**Probability: High.** The skill being tested is *proving* the local choice is safe — say the invariant out loud.

| #   | Folder                | Scenario                                                                                                      | Diff | Done |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 126 | `coupon_assignment`   | Match coupons to orders (each coupon covers orders up to its value) to maximize coupons used (sort both + greedy walk)  | E    |      |
| 127 | `room_schedule_max`   | One room, many meeting requests — schedule the maximum number of non-overlapping meetings (earliest-end-first, with proof sketch in README) | E | |
| 128 | `buffered_playback`   | Segment i lets the player skip ahead up to `buffer[i]` seconds — can playback reach the end without stalling? (reachability greedy) | M | |
| 129 | `min_rebuffers`       | Same setup — minimum number of buffer refills to finish playback (fewest jumps)                                         | M    |      |
| 130 | `fuel_stops`          | Circular delivery route with charge stations: find the starting station that completes the loop, or report impossible   | M    |      |
| 131 | `release_chunking`    | Split a release manifest into the most chunks such that each file type lives in exactly one chunk (last-occurrence partitioning) | M | |
| 132 | `raise_distribution`  | Every employee with a higher rating than a desk neighbor must earn strictly more — minimize total raises (two-pass greedy) | H  |      |

## Topic 17: String Algorithms & Parsing — _pattern (new)_

**Probability: High** for Netflix's practical style (their whole question bank is parsers); Medium elsewhere.

| #   | Folder                 | Scenario                                                                                                        | Diff | Done |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 133 | `template_interpolate` | Replace `{{name}}` placeholders from a values map in one pass; unknown keys stay literal                              | E    |      |
| 134 | `csv_field_splitter`   | Split a CSV line respecting quoted fields and escaped quotes — no regex                                               | E    |      |
| 135 | `run_length_encode`    | Compress sparse bitmap rows: `aaabb` ⇄ `a3b2`, exact round-trip, digits-in-input edge cases                           | E    |      |
| 136 | `log_rotation_check`   | Did the log rotate or get corrupted? Check if file B is a rotation of file A in O(n) (concatenation trick)            | M    |      |
| 137 | `substring_search`     | Implement `indexOf` from scratch; tests include the pathological repeated-prefix worst case — document the complexity | M    |      |
| 138 | `plagiarism_hash`      | Does an article contain any sentence from a known-plagiarized set? Rolling hash (Rabin-Karp) with collision handling  | M    |      |
| 139 | `text_diff`            | Minimal line-level diff between two file versions: output kept/added/removed lines (LCS-based — pairs with Topic 20)  | H    |      |

---

# Tier 3 — Medium Probability

## Topic 18: Binary Search Trees — _Lesson 5_

**Probability: Medium overall — but High at Meta/Amazon** (validate-BST, k-th smallest, and closest-value are screen regulars there). It sits below the Tier 2 line only because Netflix and Google frontend tracks rarely ask BST-specific questions; pull this topic forward if a Meta or Amazon loop lands.

| #   | Folder             | Scenario                                                                                                          | Diff | Done |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---- | ---- |
| 140 | `sku_index`        | Product index as a BST: `insert`, `has`, `size` keyed by SKU number                                                        | E    |      |
| 141 | `index_validator`  | An index file was imported from another system — verify it's a valid BST (min/max bounds, not just parent-child)           | M    |      |
| 142 | `kth_cheapest`     | The k-th cheapest item via in-order traversal with early stop (no full flatten)                                            | M    |      |
| 143 | `rebuild_balanced` | The index degenerated into a linked list — rebuild a balanced BST from its sorted values                                   | M    |      |
| 144 | `index_delete`     | Delete a key: leaf, one-child, and two-children (in-order successor) cases                                                 | H    |      |

## Topic 19: Backtracking — _pattern_

**Probability: Medium.** Choose → explore → un-choose, with pruning.

| #   | Folder              | Scenario                                                                                                          | Diff | Done |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---- | ---- |
| 145 | `flag_combinations` | QA matrix: every on/off combination of n feature flags (subsets)                                                           | E    |      |
| 146 | `test_orderings`    | Every possible execution order of n test scenarios (permutations, no duplicates in output)                                 | E    |      |
| 147 | `budget_bundles`    | All service bundles that hit a budget exactly; each service reusable (combination sum + pruning on sorted input)           | M    |      |
| 148 | `glob_matcher`      | Implement glob matching with `*` and `?` for file paths (the engine behind `.gitignore`-style patterns)                    | H    |      |
| 149 | `oncall_assignment` | Assign n engineers to n on-call slots under constraints (unavailability, no two adjacent slots same team) — pruned search | H    |      |

## Topic 20: Dynamic Programming — _pattern_

**Probability: Medium.** Google leans on it more than Netflix; the five tasks cover every major DP family (1D counting, coin change, LCS, edit distance, 0/1 knapsack).

| #   | Folder                  | Scenario                                                                                                       | Diff | Done |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 150 | `toolbar_layouts`       | How many ways to fill a toolbar of width n with 1-unit and 2-unit buttons? (recursion → memo → table)                     | E    |      |
| 151 | `api_credit_change`     | Fewest credit packs (sizes given) that sum to exactly n API credits, or report impossible (coin change)                   | M    |      |
| 152 | `watch_history_overlap` | Longest common ordered subsequence of two users' watch histories (recommendation similarity — LCS)                        | M    |      |
| 153 | `cli_did_you_mean`      | `git comit` → "did you mean commit?" — edit distance, then suggest closest command under a threshold                      | H    |      |
| 154 | `perf_budget_features`  | Pick features maximizing user value within a fixed JS bundle-size budget (0/1 knapsack + which features chosen)           | H    |      |

## Topic 21: Union-Find — _Lesson 15_

**Probability: Medium.** One structure, many disguises — accounts, networks, aliases.

| #   | Folder              | Scenario                                                                                                  | Diff | Done |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 155 | `network_merge`     | Basic DSU: merge networks, answer "same network?" — no optimizations yet                                            | E    |      |
| 156 | `dsu_optimized`     | Add path compression + union by size; expose component count and size of any component                              | M    |      |
| 157 | `rollout_clusters`  | Servers come online one by one with links — report cluster count after every event (online connectivity)            | M    |      |
| 158 | `redundant_cable`   | Network cabling audit: find the first cable that closes a loop (cycle detection via DSU)                            | M    |      |
| 159 | `account_merge`     | Merge duplicate user accounts that share any email address; output canonical merged accounts                        | H    |      |

## Topic 22: Weighted Graphs — MST & Shortest Paths — _Lessons 16–17_

**Probability: Medium.** Dijkstra is the one you must have cold; Kruskal and Bellman-Ford are differentiators (do Prim's and Floyd-Warshall as theory).

| #   | Folder               | Scenario                                                                                                          | Diff | Done |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---- | ---- |
| 160 | `route_cost`         | Given a weighted service map and a proposed route, compute its total cost (or report where it breaks)                      | VE   |      |
| 161 | `office_cabling`     | Cheapest way to wire all offices into one network — Kruskal with your DSU from Topic 21                                    | M    |      |
| 162 | `cdn_fastest_route`  | Lowest-latency path between two CDN nodes, with path reconstruction — Dijkstra (+ why negative weights break it)           | M    |      |
| 163 | `currency_arbitrage` | Exchange-rate table: detect a profitable conversion loop — Bellman-Ford negative-cycle detection                           | H    |      |
| 164 | `flight_within_hops` | Cheapest route with at most k hops (why plain Dijkstra fails; bounded relaxation)                                          | H    |      |

---

# Tier 4 — Low Probability (internals depth — pair with CURRICULUM.md theory)

## Topic 23: Self-Balancing Trees — _Lessons 6–7_

**Probability: Low** as a live-coding ask; **High** as a "why does TreeMap exist" discussion. Implement once for understanding.

| #   | Folder                   | Scenario                                                                                                  | Diff | Done |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------ | ---- | ---- |
| 165 | `degeneration_detector`  | Given an index tree, report height, whether it's height-balanced, and the deepest unbalanced node              | E    |      |
| 166 | `tree_rotations`         | Implement `rotateLeft` / `rotateRight` as pure pointer surgery; in-order sequence must be preserved            | M    |      |
| 167 | `rb_invariant_checker`   | Validate the five red-black invariants on a colored tree (the discussion question, made concrete)              | M    |      |
| 168 | `avl_insert`             | AVL insert with all four cases (LL, RR, LR, RL) and balance-factor tracking                                    | H    |      |
| 169 | `leaderboard_rank`       | Augmented BST (subtree sizes): "how many players score below X?" and "who is rank k?" in O(log n)              | H    |      |

## Topic 24: Range Query Structures — _Lessons 10–11_

**Probability: Low.** Segment trees/BITs almost never appear in frontend-track FAANG rounds — but they cement the recursion + array-tree mental model.

| #   | Folder               | Scenario                                                                                                             | Diff | Done |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 170 | `naive_range_engine` | Analytics baseline: array class with `rangeSum(i, j)` and `update(i, v)` done naively — establishes the API contract        | VE   |      |
| 171 | `fenwick_counter`    | Live vote tallies: same API but point update + prefix sum in O(log n) via BIT (`i & -i`)                                    | M    |      |
| 172 | `segment_tree_min`   | Uptime dashboard: min latency over any time range, with point updates (array-backed segment tree)                           | M    |      |
| 173 | `segment_tree_lazy`  | Apply a discount to a whole product range (range update) with lazy propagation, plus range-sum queries                      | H    |      |

## Topic 25: B-Trees & B+ Trees — _Lesson 8_

**Probability: Low** for coding; **High** in system-design discussions about database indexes.

| #   | Folder               | Scenario                                                                                                       | Diff | Done |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 174 | `index_page_math`    | Capacity planner: given page size and key/pointer sizes, compute branching factor and tree height for n keys           | E    |      |
| 175 | `btree_search`       | Full search over a B-tree given as nested nodes; count nodes visited ("disk reads")                                    | M    |      |
| 176 | `bplus_range_scan`   | B+ tree range query: descend to the first leaf, then walk the leaf linked list — return all keys in `[from, to]`       | M    |      |
| 177 | `btree_insert_split` | Insert into a B-tree of order m with leaf split and median promotion (root split included)                             | H    |      |

## Topic 26: Strongly Connected Components & Bridges — _Lesson 18_

**Probability: Low.** Senior-level differentiator material; built up in steps.

| #   | Folder                | Scenario                                                                                                      | Diff | Done |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 178 | `reverse_graph`       | Build the transpose of a directed service map (warm-up building block for Kosaraju)                                    | VE   |      |
| 179 | `mesh_check`          | Is every page reachable from every page via links? (DFS from one node + DFS on the reverse graph)                      | E    |      |
| 180 | `kosaraju_groups`     | Email forwarding rules: find groups where a message can loop back to its sender (Kosaraju, two passes)                 | H    |      |
| 181 | `critical_cables`     | Which network cables, if cut, split the network? (bridges via discovery time vs low-link)                              | H    |      |
| 182 | `deploy_condensation` | Collapse mutually-dependent service groups into units, then produce a safe deploy order (SCC condensation → topo)      | H    |      |

## Topic 27: Probabilistic & Randomized Structures — _Lessons 19–20_

**Probability: Low** for coding, but reservoir sampling and fair shuffles do get asked — and bloom filters star in system design.

| #   | Folder                 | Scenario                                                                                                             | Diff | Done |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 183 | `bloom_sizing`         | Given n expected URLs and a target false-positive rate, compute optimal bit-array size m and hash count k                    | E    |      |
| 184 | `shuffle_playlist`     | Fair playlist shuffle — Fisher-Yates with injectable RNG; tests detect the classic biased-shuffle bug                        | M    |      |
| 185 | `random_sampler`       | Pick k fair samples from a log stream of unknown length in one pass (reservoir sampling, injectable RNG)                     | M    |      |
| 186 | `crawler_bloom`        | "Probably seen this URL?" — bloom filter with k hash functions; tests verify no false negatives ever                         | M    |      |
| 187 | `leaderboard_skiplist` | Sorted leaderboard with O(log n) expected insert/search/delete — skip list with injectable RNG (deterministic tests)         | H    |      |

---

## Progress Summary

| Tier | Probability | Topics | Tasks | Range |
| ---- | ----------- | ------ | ----- | ------- |
| 1 | Very High | 9 | 81 | 001–081 |
| 2 | High | 8 | 58 | 082–139 |
| 3 | Medium | 5 | 25 | 140–164 |
| 4 | Low | 5 | 23 | 165–187 |
| **Total** | | **27** | **187** | |

### How to use the tiers

- **Interview in < 4 weeks:** Tier 1 fully, plus Binary Search, Heaps, Linked Lists, Caches, and Tries from Tier 2 (Topics 10–14). Skip Tier 4 coding; read the matching CURRICULUM.md lessons instead.
- **Interview in 1–3 months:** Tiers 1–3 in order. Tier 4 only after everything else feels automatic.
- **No date yet (skill building):** straight through, 001 → 187, interleaved with CURRICULUM.md lessons per topic.
- Re-solve every ⭐ task and every task you failed on the first try — one week later, from a blank file.

---

*Practical DSA Tasks · Artur Fedorov · Generated by Claude*
