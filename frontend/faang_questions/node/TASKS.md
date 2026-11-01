# Node.js & API Practice Tasks — Netflix POSA Prep

**Companion to:** [../POSA_PREP.md](../POSA_PREP.md) · The full-stack half: "foundational backend services that support the partner lifecycle."
**Style:** framework-free where possible — plain handlers, in-memory stores, injectable clocks. The GraphQL topic needs the `graphql` package; everything else runs on Node built-ins. All jest-testable, no real network or disk.
**Format:** same contract as algo — README + typed stub = the prompt, tests = the grader.
**Difficulty:** `VE` Very Easy · `E` Easy · `M` Medium · `H` Hard.
**Prerequisite:** re-solve `algo` Topic 9 (async orchestration) first — circuit breaker, pools, and task graphs are assumed knowledge here.

---

# Tier 1 — Very High Probability

## Topic 1: Node Fundamentals & Server-Side Async

Event loop, streams, and process lifecycle — what "Node experience" means beyond writing endpoints.

| #   | Folder                  | Scenario                                                                                                             | Diff | Done |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 001 | `env_config`            | Typed config loader: env vars with defaults, required-var validation, type coercion, fail-fast report of all missing keys              | E    |      |
| 002 | `event_loop_ordering`   | Predict-then-verify harness: setTimeout vs setImmediate vs promises vs process.nextTick — document the phases in the README answers    | E    |      |
| 003 | `async_error_wrapper`   | Operational vs programmer errors: async handler wrapper that catches, classifies, and formats — and lets programmer errors crash       | M    |      |
| 004 | `log_stream_reader`     | Process a multi-GB delivery log as a stream, line by line (chunk-boundary line splitting) — constant memory, verified                  | M    |      |
| 005 | `report_batch_processor`| Process 10k partner report jobs with bounded concurrency and per-job error isolation (your algo pool, production-shaped)               | M    |      |
| 006 | `request_context`       | Request-id propagation through async calls with AsyncLocalStorage — logger picks up the id with no parameter drilling                  | M    |      |
| 007 | `graceful_shutdown`     | SIGTERM handling: stop accepting work, drain in-flight jobs with a deadline, then exit — injectable timers, fully tested               | M    |      |
| 008 | `worker_offload`        | Offload checksum computation of large payloads to worker_threads — main loop stays responsive (event-loop-blocking test)               | H    |      |

## Topic 2: REST API Design

The partner-facing surface: correct semantics, not just working routes. Framework-free (handlers as pure functions).

| #   | Folder                | Scenario                                                                                                               | Diff | Done |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---- | ---- |
| 009 | `router_dispatch`     | Method+path router with path params (`/partners/:id`) — request → handler + params, 404/405 distinction                                 | E    |      |
| 010 | `middleware_chain`    | Compose middleware (auth, logging, error handler) express-style — order matters, error middleware short-circuits                        | M    |      |
| 011 | `partners_crud`       | Partners resource: POST/GET/PUT/PATCH/DELETE with correct status codes (201+Location, 204, 404, 409 on conflict), in-memory store        | M    |      |
| 012 | `list_query_semantics`| GET /deliveries with filtering, sorting, cursor pagination — stable cursors under concurrent inserts                                    | M    |      |
| 013 | `request_validation`  | Body validation → 400 with per-field error details; reject unknown fields; coerce query types                                           | M    |      |
| 014 | `idempotency_keys`    | Retry-safe POST /reports with Idempotency-Key: same key replays the stored response, conflicting payload → 422                          | H    |      |
| 015 | `rate_limit_by_key`   | Per-API-key rate limiting middleware (your algo token bucket) with correct 429 + Retry-After headers                                    | M    |      |
| 016 | `etag_caching`        | ETag generation + If-None-Match → 304 for partner catalog reads; If-Match → 412 for lost-update protection on writes                     | M    |      |

---

# Tier 2 — High Probability

## Topic 3: GraphQL Essentials

The JD says "more preferable — GraphQL." Uses the `graphql` package against in-memory data.

| #   | Folder                 | Scenario                                                                                                              | Diff | Done |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 017 | `partner_schema`       | Design the SDL for the partner domain (Partner, Integration, Delivery, statuses as enums) — nullability decisions documented             | E    |      |
| 018 | `resolvers_basic`      | Wire resolvers over the in-memory store: queries with args, nested field resolution, resolver chain order                                | M    |      |
| 019 | `dataloader_from_scratch` | Kill the N+1: implement a batching+caching DataLoader yourself (event-loop-tick batching), prove call counts drop                     | H    |      |
| 020 | `mutations_payloads`   | Mutations with input types and typed error payloads (userErrors pattern) — not thrown errors                                             | M    |      |
| 021 | `relay_connections`    | Cursor-based connections (edges/pageInfo) for the deliveries list — consistent with your REST cursor semantics                           | M    |      |
| 022 | `field_authorization`  | Per-field auth: partners see their own commercial data, internal users see all — resolver-level checks with a context user               | M    |      |
| 023 | `rest_wrapping_gateway`| Wrap two "legacy" REST services in one GraphQL gateway; README includes the refactor-vs-rebuild tradeoff writeup the JD asks about        | M    |      |

## Topic 4: Data & Persistence Patterns

DB-shaped thinking, testable in memory.

| #   | Folder                | Scenario                                                                                                                | Diff | Done |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 024 | `repository_pattern`  | PartnerRepository interface + in-memory implementation — the seam that makes everything else testable                                      | M    |      |
| 025 | `safe_query_builder`  | Parameterized SQL builder (select/where/order/limit) that makes injection impossible by construction — string tests prove it               | M    |      |
| 026 | `transaction_semantics`| Transfer credits between partner accounts with commit/rollback semantics over the in-memory store — partial failure leaves no trace        | M    |      |
| 027 | `migrations_runner`   | Ordered migration runner: applied-set tracking, dependency ordering (your topo sort), dry-run mode, idempotent re-run                      | M    |      |
| 028 | `unique_constraint_race` | Two concurrent "create partner with same email" requests: exactly one wins cleanly — constraint-check-then-insert race, fixed            | H    |      |
| 029 | `audit_event_log`     | Append-only audit log + projection rebuild (partner state from events) — the transparency-tooling pattern from the JD                      | M    |      |
| 030 | `connection_pool`     | Generic resource pool: acquire/release, max size, waiter queue with timeout, health-check eviction — the systems capstone                  | H    |      |

---

## Progress Summary

| Tier | Topics | Tasks | Range |
| ---- | ------ | ----- | ------- |
| 1 | 2 | 16 | 001–016 |
| 2 | 2 | 14 | 017–030 |
| **Total** | **4** | **30** | |

---

*Node Track · Netflix POSA Prep · Artur Fedorov · Generated by Claude*
