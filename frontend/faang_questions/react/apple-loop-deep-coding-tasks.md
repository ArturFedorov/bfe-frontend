# Apple Prep — Deep Coding Task Catalog (074–101)

Task catalog for the 60-minute builds. The learning plan (order, mixing with algo and the project, talk topics)
lives in [`../APPLE_PLAN.md`](../APPLE_PLAN.md). Every folder under `frontend/faang_questions/react/<NNN>_<folder>/`
holds `README.md` + typed stub + tests (the grader) + `demo.tsx` for the playground (`npm run dev:react`).
Shared test fakes: `_helpers/`. Difficulty **M** Medium · **H** Hard · **VH** Very Hard. Priority **P1** most likely · **P2** likely · **P3** stretch.

---

## Tier 4 — Annotation Platform & Agentic UI (074–091)

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

---

## Tier 5 — Customer Engagement Tooling (092–101, ASE, added Nov 2026)

Role: Apple Services Engineering, Customer Engagement platform (London). Themes: React Query, React Router,
design systems / Tailwind-style utilities, micro-frontends, REST/GraphQL, event-driven architecture, CMS, TDD.

| # | Folder | Scenario | Diff | Prio |
|---|---|---|---|---|
| 092 | `mini_react_query` | Hand-rolled `useQuery` / `useMutation`: cache keys, stale-while-revalidate, in-flight dedupe, invalidation, optimistic mutation with rollback. | H | P1 |
| 093 | `mini_router` | `Router`/`Routes`/`Route`/`Link`/`Outlet`, params, ranking, `useSearchParams`, `RequireAuth` redirect preserving `from`. | H | P1 |
| 094 | `audience_segment_builder` | Nested AND/OR rule tree editor with live match count; pure `evaluate` / `countMatches`; structural sharing. | H | P1 |
| 095 | `message_template_editor` | `{{placeholder \| fallback}}` + `{{block:id}}` tokenizer, live preview, problems alert, caret insertion, sms counter. | M | P1 |
| 096 | `send_schedule_picker` | Timezone-aware next sends via Intl, quiet hours shifting, daily/weekly recurrence that survives DST. | M | P2 |
| 097 | `journey_builder` | Steps + edges graph editor: validation (cycle, unreachable, dangling branch), simulate a customer path. | VH | P2 |
| 098 | `channel_preview_tabs` | Compound ARIA tabs with design tokens and a `cx` utility; controlled/uncontrolled; per-channel preview frame. | M | P2 |
| 099 | `micro_frontend_shell` | Shell lazy-loading remotes from a manifest: Suspense, per-remote error boundary + Retry, shared event bus, single-flight loads. | H | P1 |
| 100 | `feature_flag_context` | Flags via Context on `useSyncExternalStore`: selector isolation, persisted overrides, `<Feature>`, no-provider warning. | M | P2 |
| 101 | `campaign_approval_grid` | URL-synced paginated grid with React-Query-style fetching, cross-page selection, optimistic bulk approve with rollback. | H | P1 |

---

## Progress

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

| 092 | `mini_react_query` | useQuery/useMutation with SWR, dedupe, invalidation, optimistic rollback | H |      |
| 093 | `mini_router` | History-API router with nested routes, params, search params, auth redirect | H |      |
| 094 | `audience_segment_builder` | AND/OR rule tree editor with live match count | H |      |
| 095 | `message_template_editor` | Placeholder tokenizer, preview, problems, caret insert, sms counter | M |      |
| 096 | `send_schedule_picker` | Intl-based next sends, quiet hours, DST-safe recurrence | M |      |
| 097 | `journey_builder` | Journey graph editor with validation and simulation | VH |      |
| 098 | `channel_preview_tabs` | Compound ARIA tabs + design tokens + cx | M |      |
| 099 | `micro_frontend_shell` | Remote loading shell: Suspense, boundaries, event bus | H |      |
| 100 | `feature_flag_context` | Flag store on useSyncExternalStore with overrides | M |      |
| 101 | `campaign_approval_grid` | URL-synced grid, selection across pages, optimistic bulk approve | H |      |

Re-solve rule: anything solved with hints goes back in the queue for a blank-file redo a week later.

---

*Apple Prep Task Catalog · Artur Fedorov · Generated by Claude*
