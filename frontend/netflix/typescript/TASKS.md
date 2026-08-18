# TypeScript Practice Tasks — Netflix POSA Prep

**Companion to:** [../POSA_PREP.md](../POSA_PREP.md) · Daily-dose track alongside React.
**Style:** application-grade TypeScript — the types you actually write in a partner-tools codebase, not type golf. Type-level tasks are verified by compilation (`tsc` + `@ts-expect-error` assertions + type-equality helpers); runtime behavior by jest where it exists.
**Format:** each folder gets `README.md`, a stub `.ts`, and a test file. Some "tests" are compile-time only — the suite passes when `tsc` accepts the valid cases and rejects the marked-invalid ones.
**Difficulty:** `VE` Very Easy · `E` Easy · `M` Medium · `H` Hard.

---

# Tier 1 — Very High Probability

## Topic 1: Narrowing & Discriminated Unions

The single highest-yield TS skill for app code — modeling states so invalid ones can't compile.

| #   | Folder                 | Scenario                                                                                                             | Diff | Done |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 001 | `api_response_union`   | Model an integration-status API response as a discriminated union (loading/success/error); exhaustive switch with `never` guard      | E    |      |
| 002 | `type_predicates`      | `isPartner(x): x is Partner` guards for filtering mixed arrays — and why `Boolean` filter doesn't narrow                             | E    |      |
| 003 | `unknown_boundary`     | Parse `unknown` JSON from a webhook into a typed object with zero `as` casts — narrowing all the way down                             | M    |      |
| 004 | `assertion_functions`  | `assertDelivered(status): asserts status is Delivered` — assertion functions for invariant checks                                    | M    |      |
| 005 | `error_taxonomy`       | Union of app errors (network/validation/auth/unknown) with an exhaustive handler; adding a variant breaks compilation where it should | M    |      |
| 006 | `webhook_event_map`    | Partner webhook events as a discriminated union + typed handler registry — handler arg narrows per event type                         | M    |      |
| 007 | `narrowing_traps`      | Fix a file of narrowing failures: optional chains, `in` vs `typeof`, array element access, destructuring that loses narrowing        | M    |      |
| 008 | `satisfies_configs`    | Route/config objects with `satisfies` + `as const`: keep literal inference AND constraint checking (and know why `: Type` loses it)   | M    |      |

## Topic 2: Generics in Practice

Generics as they appear in app code and code review — inference, constraints, and API design.

| #   | Folder                | Scenario                                                                                                              | Diff | Done |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 009 | `typed_pick`          | Implement runtime `pick(obj, keys)` whose return type is exactly `Pick<T, K>`                                                          | E    |      |
| 010 | `constrained_getters` | `getField(items, key)` with `K extends keyof T` — constraints and indexed-access return types                                          | E    |      |
| 011 | `typed_api_client`    | `api.get('/partners/:id')` returns the right type from a route→response type map — one generic signature, no overload explosion        | M    |      |
| 012 | `collection_helpers`  | `groupBy` / `indexBy` with correct inference for key unions and value types                                                            | M    |      |
| 013 | `typed_pipe`          | `pipe(f, g, h)` where each function's output feeds the next input — inference across the chain                                         | M    |      |
| 014 | `paginated_wrapper`   | `Paginated<T>` response envelope with generic defaults; mapping helpers that preserve the item type                                    | M    |      |
| 015 | `typed_event_emitter` | EventEmitter over an event-payload map: `on`/`emit` fully typed per event name (the classic senior screen)                             | H    |      |
| 016 | `fluent_builder`      | Query builder where the type accumulates: `.select()` then `.where()` only offers selected fields; `.build()` requires completeness    | H    |      |

---

# Tier 2 — High Probability

## Topic 3: Mapped, Conditional & Template Literal Types

The utility-types layer — implement what you import, then go past it.

| #   | Folder                 | Scenario                                                                                                            | Diff | Done |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 017 | `utility_types_redo`   | Implement `Partial`, `Required`, `Readonly`, `Pick`, `Omit` from scratch (no importing the built-ins)                                | M    |      |
| 018 | `key_remapping`        | `Getters<T>` → `{ getName(): string }` via mapped-type `as` remapping; `OmitByValue<T, V>`                                            | M    |      |
| 019 | `deep_partial`         | Recursive `DeepPartial<T>` that handles arrays, functions, and Date without corrupting them                                          | H    |      |
| 020 | `conditional_basics`   | Implement `Extract`, `Exclude`, `NonNullable`; demonstrate distributive vs non-distributive conditionals                             | M    |      |
| 021 | `infer_toolkit`        | Implement `ReturnType`, `Parameters`, `Awaited` (recursive) with `infer`                                                             | M    |      |
| 022 | `route_params`         | `RouteParams<'/partners/:id/reports/:reportId'>` → `{ id: string; reportId: string }` via template literal types                     | H    |      |
| 023 | `union_filters`        | `FilterByKind<Event, 'delivery'>` — extract union members by discriminant; `MapByKind` handler-map type                              | M    |      |
| 024 | `object_paths`         | `Get<T, 'a.b.c'>` — dot-path access type for a config reader, with autocomplete-able path union                                      | H    |      |

## Topic 4: Type-Safe Patterns for Apps

Patterns that make a partner-tools codebase safer — the "how do you use TS at scale" discussion, made concrete.

| #   | Folder                | Scenario                                                                                                              | Diff | Done |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 025 | `branded_ids`         | `PartnerId` vs `IntegrationId` as branded types — mixing them up fails compilation; constructor/validator functions                    | M    |      |
| 026 | `result_type`         | `Result<T, E>` with ok/err helpers, map/andThen — error handling without throw across a service boundary                              | M    |      |
| 027 | `exhaustive_reducer`  | Reducer action union where every action is handled — adding an action without a case fails compilation (feeds React Topic 5)          | M    |      |
| 028 | `schema_infer_lite`   | Mini runtime validator (`string()`, `number()`, `object({...})`) whose `Infer<S>` derives the static type — zod's core trick           | H    |      |
| 029 | `readonly_boundaries` | `readonly`/`ReadonlyArray`/`as const` at module edges: exported config that consumers provably can't mutate                            | M    |      |
| 030 | `overload_migration`  | Type an untyped legacy JS API with overloads (the refactor-vs-rebuild JD line, in miniature): same function, three call shapes         | M    |      |
| 031 | `declare_module`      | Write declarations for an untyped in-house package: `declare module`, ambient types, augmenting an existing module                     | M    |      |

---

## Progress Summary

| Tier | Topics | Tasks | Range |
| ---- | ------ | ----- | ------- |
| 1 | 2 | 16 | 001–016 |
| 2 | 2 | 15 | 017–031 |
| **Total** | **4** | **31** | |

Note: overlaps intentionally avoided with existing type tasks in `frontend/netflix/` (deep_readonly, conditional_type_parser) — those stay in rotation.

---

*TypeScript Track · Netflix POSA Prep · Artur Fedorov · Generated by Claude*
