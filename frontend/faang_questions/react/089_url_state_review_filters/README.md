# 089. URL State Review Filters

**Difficulty:** Medium
**Estimated time:** 60 min
**Topics:** History API, URL as state, custom hooks, debouncing, popstate, generic schemas

---

## Scenario

QA analysts on the ML annotation platform review labelled tasks through a filterable queue: a
free-text search, a status filter (`pending` / `approved` / `rejected`), paging, and a currently
selected task. Analysts constantly paste links into Slack ("look at page 3 of the rejected NER
batches, task t-17") and expect the recipient to land on the same view; they also lean on the
browser Back button to undo a filter change.

The first version kept everything in `useState`, so links lost the view, Back left the page, and
a later attempt that wrote every keystroke with `pushState` produced 40 history entries per
search. Build a small generic `useUrlState` hook (no router library) and a `<ReviewFilters />`
component on top of it.

## Requirements

1. `useUrlState<T>(schema: UrlSchema<T>)` returns `[state, setState]`. On mount it reads
   `window.location.search` and parses every key through its schema entry. The `UrlSchema<T>`
   shape is given in `use_url_state.ts`.
2. `setState(partial, { replace? })` merges the partial into the current state, serializes the
   whole state, and writes the URL with `history.pushState` by default or `history.replaceState`
   when `replace: true`. Only the search part changes; pathname and hash are preserved.
3. Clean URLs: a key whose serialized value equals the serialized default — or whose serializer
   returns `null` — is omitted from the query string. All-default state yields an empty search.
4. `popstate` (Back/Forward) re-parses the URL into state. The listener is removed on unmount.
5. Invalid raw values never crash: `parse` is responsible for falling back (`page=abc` → `1`,
   `status=bogus` → `'all'`). The hook never rewrites the URL on mount.
6. Export two pure helpers used by the hook and the tests: `parseUrlState(schema, search)` and
   `serializeUrlState(schema, state)` (returns `''` or a string starting with `?`).
7. `<ReviewFilters tasks? pageSize? />` uses the hook with exactly these query keys and defaults:
   `q` (`''`), `status` (`'all'`), `page` (`1`), `task` (`null`). Default data is the exported
   `REVIEW_TASKS` (23 tasks, ids `t-1`…`t-23`, titles `<Kind> batch <n>` with kinds cycling
   Sentiment / NER / Intent / Toxicity and statuses cycling pending / approved / rejected).
   Default `pageSize` is 5.
8. Search: a text input labelled `Search`. The input updates immediately, but the URL is written
   **300 ms after the last keystroke** with `replace: true`, so typing adds no history entries.
   A search change also resets `page` to 1. When the URL changes from outside (Back), the input
   shows the restored value and must not be treated as new typing (no write-back).
9. Status: a `<select>` labelled `Status` with options `all` / `pending` / `approved` /
   `rejected`. Changing it uses `pushState` and resets `page` to 1.
10. Paging: `Page N of M` text plus `Previous` / `Next` buttons (`pushState`). `Previous` is
    disabled on page 1, `Next` on the last page. A `page` beyond the range is clamped for display.
    Filtering is case-insensitive substring on the title combined with the status filter.
11. Rows: a `role="list"` named `Review tasks`; each row is a button reading
    `<id> · <title> · <status>` with `aria-pressed` reflecting selection. Clicking a row sets
    `task=<id>` with `pushState`. `Selected task: <id>` (or `none`) is shown. When nothing matches
    render `No tasks match`.

## Acceptance criteria

- [ ] `parseUrlState` returns defaults for an empty search, parses valid values, ignores unknown
      keys, and falls back for `page=abc`, `page=0`, `status=bogus`.
- [ ] `serializeUrlState` omits default/`null` keys, returns `''` when all default, round-trips.
- [ ] Hook: initial read from URL; `setState` merges + pushes (history length +1); `replace: true`
      uses `replaceState` (history length unchanged); defaults are dropped from the URL.
- [ ] Hook: `popstate` restores state; listener removed on unmount.
- [ ] Component: `?status=approved&page=2&task=t-17` renders the right select value, page text,
      rows `t-17, t-20, t-23`, `aria-pressed`, and `Selected task: t-17`.
- [ ] Component: invalid params fall back without any `pushState`/`replaceState` on mount.
- [ ] Status change → URL `status=…`, page reset, one history entry; back to `all` → clean URL.
- [ ] Next/Previous push entries, clamp at bounds, disabled states correct; `page=99` clamps.
- [ ] Clicking a row writes `task=<id>` via `pushState`; Enter on a focused row works.
- [ ] Typing `ner` does not touch the URL before 300 ms; after 300 ms `q=ner` and the list shows
      the first NER page.
- [ ] Senior: typing 5 characters → zero new history entries, `pushState` never called,
      `replaceState` called exactly once.
- [ ] Senior: Back after a status change restores the previous status in the UI; Back after
      search + status restores both, and the restored search does not trigger a write-back.
- [ ] Real `window.history.back()` in jsdom restores selection and page.

## Baseline a11y

- Inputs are associated with visible labels (`Search`, `Status`) — queryable via `getByLabelText`.
- The results list has `role="list"` and an accessible name; rows are real `<button>`s with
  `aria-pressed`, so they are keyboard operable and announce selection.
- Disabled paging buttons use the `disabled` attribute, not a CSS class.

## Constraints

- No third-party libraries (no router, no query-string library). Use `URLSearchParams`, the
  History API and React only.
- `parse` must never throw. The hook must never write the URL on mount.
- Do not store derived rows in state; derive them at render time.

## Interviewer follow-ups

- The URL now holds state and so does React. Which one is the source of truth, and what happens
  if another part of the app calls `history.pushState` without going through this hook?
- How would you version the URL schema when `status` gains a new value or `q` is renamed, so old
  shared links keep working?
- Search is debounced with `replaceState`, but the status select pushes. What rule decides
  push vs replace in general, and how would you explain that rule to a designer?
- The selected task id is in the URL. If the task list is fetched from a server and the id no
  longer exists on the current page, what should the UI do — and should it rewrite the URL?

## Say out loud

- **State shape first:** `{ q: string; status: StatusFilter; page: number; task: string | null }`
  lives in the URL; only the raw input `draft` is local component state.
- **Race / cleanup hazard:** the debounce timer must be cleared on every keystroke and on
  unmount; the `popstate` listener must be removed; a Back navigation that changes `q` must not
  be mistaken for typing (otherwise it writes the URL again).
- **One data-shape question:** "Are task ids globally unique across projects, or do I also need
  a project key in the URL?"
- **One failure-handling question:** "If a shared link contains a `task` id that is filtered
  out by the current `status`, should we clear the selection, widen the filter, or just show
  `Selected task` without a highlighted row?"
- **First test you'd write:** `parseUrlState(schema, '?page=abc')` returns `page: 1` — the pure
  function with the fallback rule, before any DOM.
