# React Practice Tasks — Netflix POSA Prep

**Companion to:** [../POSA_PREP.md](../POSA_PREP.md) · **Priority: #1 track** (React is "obligatory" in the JD)
**Style:** every task is an internal-tools scenario from the POSA domain — partner portals, integration monitoring, delivery dashboards. No toy counters.
**Format:** each task folder gets `README.md` (scenario, acceptance criteria, one interviewer follow-up), a `.tsx` stub with typed props, and an RTL test suite (`/** @jest-environment jsdom */`). Tests are the grader, not the spec. Every component task includes baseline a11y requirements (roles, labels, keyboard) — a11y is graded inline, not as a separate topic.
**Difficulty:** `VE` Very Easy · `E` Easy · `M` Medium · `H` Hard.

---

# Tier 1 — Very High Probability

## Topic 1: Hooks Fundamentals & Effects

The mechanics every other topic assumes: state, effects, cleanup, refs — and the classic effect bugs interviewers plant.

| #   | Folder                  | Scenario                                                                                                            | Diff | Done |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 001 | `status_badge`          | Integration status badge: render label + color variant from typed props, unknown status falls back safely                      | VE   |      |
| 002 | `partner_search_input`  | Controlled search input with clear button and character counter — controlled-component mechanics done right                    | E    |      |
| 003 | `collapsible_panel`     | Details panel with show/hide — and the difference between conditional render and CSS hiding (state survives one, not the other) | E    |      |
| 004 | `last_updated_clock`    | "Updated 12s ago" ticker: interval + cleanup, no stale closures, unmount safety                                                | E    |      |
| 005 | `fetch_on_mount`        | Load the partner list on mount: loading/error/empty/success states, cleanup prevents setState-after-unmount                    | M    |      |
| 006 | `race_free_search`      | Results panel refetches when the query prop changes — fix the stale-response race (out-of-order resolutions must never win)    | M    |      |
| 007 | `metric_delta`          | Show a metric and its change vs the previous render value (usePrevious via ref — why state alone can't do it)                  | M    |      |
| 008 | `focus_shortcuts`       | `/` focuses search, Escape clears and blurs; focus first invalid field on failed submit (refs, imperative focus)               | M    |      |

## Topic 2: Custom Hooks

Extracting logic is the #1 senior-React signal. Each hook gets its own contract and edge cases.

| #   | Folder               | Scenario                                                                                                          | Diff | Done |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 009 | `use_toggle`         | `useToggle(initial)` → [value, toggle, setOn, setOff]; stable function identities                                             | VE   |      |
| 010 | `use_debounced_value`| `useDebouncedValue(value, ms)` — the input half of every search box; timer cleanup on change and unmount                      | E    |      |
| 011 | `use_local_storage`  | `useLocalStorage(key, initial)` — lazy init, JSON round-trip, corrupt-value fallback, function updates                        | M    |      |
| 012 | `use_fetch`          | `useFetch(url)` — states + AbortController on url change and unmount; refetch()                                               | M    |      |
| 013 | `use_interval`       | `useInterval(cb, ms)` with the latest-callback ref pattern; ms=null pauses                                                    | M    |      |
| 014 | `use_async`          | `useAsync(fn)` — idle/loading/success/error state machine with run(); ignores stale settlements                               | M    |      |
| 015 | `use_event_listener` | `useEventListener(target, type, handler)` — window resize/keydown, handler ref, proper add/remove pairing                     | M    |      |
| 016 | `use_undo_state`     | `useUndoState(initial)` — past/present/future with undo/redo/set (your algo 004 as a hook)                                    | H    |      |

## Topic 3: Data Fetching & Async UI

The Netflix practical round in React form — async correctness with a UI attached.

| #   | Folder                  | Scenario                                                                                                            | Diff | Done |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---- | ---- |
| 017 | `async_button`          | "Sync now" button: pending state, double-submit guard, error recovery                                                            | E    |      |
| 018 | `async_states_panel`    | Render all four fetch states (loading skeleton / error with retry / empty / data) from a hook result — no impossible states      | E    |      |
| 019 | `paginated_table`       | Server-paginated deliveries table: page controls, total count, page resets on filter change, loading row placeholder             | M    |      |
| 020 | `infinite_partner_feed` | Infinite scroll of partner events via IntersectionObserver (mocked in tests); no duplicate pages, end-of-list state              | M    |      |
| 021 | `retry_panel`           | Failed integration check: manual retry button + auto-retry countdown with backoff display; cancel on unmount                     | M    |      |
| 022 | `polling_status_widget` | Poll an integration status every 5s: pause while a request is in flight, back off on errors, stop on terminal status             | M    |      |
| 023 | `optimistic_toggle`     | Partner feature flag switch: optimistic flip, rollback + error toast on failure, no flicker on success                           | H    |      |
| 024 | `partner_autocomplete`  | The classic: debounced autocomplete with abort, keyboard navigation (↑↓ Enter Escape), highlight match, combobox a11y roles      | H    |      |

## Topic 4: Component Patterns & Composition

API design for components — what "senior" looks like in a component tree.

| #   | Folder                   | Scenario                                                                                                          | Diff | Done |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 025 | `layout_slots`           | Page card with header/actions/footer slots via children and named props — composition over configuration                       | VE   |      |
| 026 | `flexible_input`         | Input supporting both controlled (`value`) and uncontrolled (`defaultValue`) modes — detect, warn on switching                 | M    |      |
| 027 | `compound_tabs`          | `<Tabs><Tab/><TabPanel/></Tabs>` compound components sharing state via context; keyboard arrows + roles                        | M    |      |
| 028 | `accordion_group`        | Accordion with single- and multi-expand modes; controlled and uncontrolled usage                                               | M    |      |
| 029 | `modal_portal`           | Modal via createPortal: Escape closes, backdrop click, scroll lock, focus returns to trigger                                   | M    |      |
| 030 | `dropdown_menu`          | Actions menu: outside-click close, keyboard navigation, disabled items — no positioning library                                | M    |      |
| 031 | `error_boundary`         | Error boundary (class component — know why hooks can't) with fallback render prop and reset key                                | M    |      |
| 032 | `toast_system`           | App-wide toasts: context API + portal + queue + auto-dismiss timers + pause-on-hover                                           | H    |      |

## Topic 5: State Management at App Scale

useReducer, context, and normalized state — before reaching for a library.

| #   | Folder                | Scenario                                                                                                              | Diff | Done |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 033 | `filter_reducer`      | Table filter bar (status, region, search, clear-all) as one useReducer with a typed action union                                    | E    |      |
| 034 | `wizard_reducer`      | Partner onboarding wizard: step state machine in a reducer — legal transitions only, back preserves data                            | M    |      |
| 035 | `undo_redo_reducer`   | Reducer with undo/redo history wrapper (higher-order reducer)                                                                       | M    |      |
| 036 | `theme_context`       | Theme provider + `useTheme()` that throws outside the provider; persistence via your 011 hook                                       | M    |      |
| 037 | `normalized_store`    | Partners + integrations in normalized shape (byId/allIds): updates touch one entity, derived selectors, no duplication              | H    |      |
| 038 | `row_selection_state` | Multi-select table rows: select all / none / page; header checkbox indeterminate state; survives pagination                         | M    |      |
| 039 | `context_splitting`   | A laggy dashboard where one context holds everything — split state/dispatch contexts and prove the fix with render counters         | H    |      |

## Topic 6: Performance & Re-renders

Netflix asks "why is this slow" more often than "make this fancy."

| #   | Folder                  | Scenario                                                                                                           | Diff | Done |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---- | ---- |
| 040 | `render_counter_lab`    | Instrument a component tree with render counters; explain (in README answers) why each child re-renders                          | E    |      |
| 041 | `memo_boundaries`       | Fix a table where every row re-renders on any change: React.memo + stable props (the identity-churn hunt)                         | M    |      |
| 042 | `callback_stability`    | Given laggy filters: apply useCallback/useMemo only where they help — tests assert render counts, over-memoization also flagged   | M    |      |
| 043 | `list_key_bugs`         | Reproduce and fix the index-as-key bug (reordering corrupts row input state)                                                      | M    |      |
| 044 | `derived_data_memo`     | Filter+sort 10k deliveries: memoized derivation, no state duplication of derived data                                             | M    |      |
| 045 | `virtualized_list`      | Windowed 50k-row log viewer from scratch: overscan, scroll position, stable heights — no library                                  | H    |      |
| 046 | `lazy_admin_panel`      | React.lazy + Suspense for a heavy admin panel: loading fallback, error fallback, preload on hover                                 | M    |      |

---

# Tier 2 — High Probability

## Topic 7: Forms & Validation

Internal tools are 60% forms. No form libraries — the mechanics are the interview.

| #   | Folder                | Scenario                                                                                                             | Diff | Done |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 047 | `credentials_form`    | API-credentials form: controlled fields, submit handling, disable-while-pending                                                     | E    |      |
| 048 | `field_validation`    | Sync validation with touched/dirty tracking; errors announced via aria-describedby, shown on blur not keystroke                     | M    |      |
| 049 | `async_unique_check`  | Partner ID field validated against the server: debounced, race-safe, validating spinner state                                       | M    |      |
| 050 | `contact_field_array` | Dynamic contact rows (add/remove/reorder) with per-row validation — keys done right                                                 | M    |      |
| 051 | `dependent_fields`    | Country → region → timezone cascading selects: downstream resets, derived option loading                                            | M    |      |
| 052 | `upload_form`         | Content-delivery upload: file type/size validation, progress bar, cancel, mock transport                                            | M    |      |
| 053 | `onboarding_wizard`   | Capstone: multi-step partner onboarding — per-step validation, persistence across steps, review screen, submit with rollback        | H    |      |

## Topic 8: Testing React (RTL)

The JD names testing explicitly. Here you write the tests; implementations are provided.

| #   | Folder                 | Scenario                                                                                                            | Diff | Done |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 054 | `test_rendered_output` | Given a StatusCard component: test with role/label queries (not test-ids), variants, conditional content                             | E    |      |
| 055 | `test_user_flows`      | Given a filter form: userEvent typing, selection, submit — assert on outcomes, not implementation                                    | M    |      |
| 056 | `test_async_ui`        | Given a fetching list: findBy/waitFor, loading→data→error paths, fetch mocked at the boundary                                        | M    |      |
| 057 | `test_custom_hooks`    | Given two hooks (one with timers): renderHook, act, fake timers                                                                      | M    |      |
| 058 | `test_with_providers`  | Given components needing theme+auth contexts: build a custom render with wrapper providers                                           | M    |      |
| 059 | `test_polling_widget`  | Given the polling widget shape from 022: fake timers advancing polls, backoff assertions, unmount stops the loop                     | H    |      |
| 060 | `test_error_paths`     | Given an app slice: error boundary fallback, rejected mutations, toast announcements (aria-live) — the unhappy-path suite            | M    |      |

## Topic 9: Routing & App Architecture

Internal tools are multi-page SPAs. Built dependency-free: you write the mini-router first, then use it.

| #   | Folder               | Scenario                                                                                                                | Diff | Done |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 061 | `mini_router`        | Build Router/Route/Link/useRoute on the History API + context: path params, navigation without reload                              | H    |      |
| 062 | `protected_routes`   | Auth gate: redirect to login preserving the intended destination, restore after login                                              | M    |      |
| 063 | `url_state_filters`  | Table filters synced to query params — shareable/bookmarkable dashboard state, back button works (the internal-tools classic)       | M    |      |
| 064 | `breadcrumbs`        | Breadcrumbs derived from the current route + route config; collapsed middle for deep paths                                         | E    |      |
| 065 | `route_code_split`   | Lazy route components with Suspense fallback and per-route error boundary                                                          | M    |      |
| 066 | `not_found_handling` | 404 route, unknown-partner-id handling (fetch 404 → not-found UI, not error UI)                                                    | M    |      |
| 067 | `app_shell`          | Capstone: sidebar layout with nested routes, active nav state, page titles — the skeleton every POSA tool shares                    | M    |      |

---

## Progress Summary

| Tier | Topics | Tasks | Range |
| ---- | ------ | ----- | ------- |
| 1 | 6 | 46 | 001–046 |
| 2 | 3 | 21 | 047–067 |
| **Total** | **9** | **67** | |

Re-solve rule from algo applies: anything solved with hints goes back in the queue for a blank-file redo a week later.

---

*React Track · Netflix POSA Prep · Artur Fedorov · Generated by Claude*
