# 109. JSON Tree Viewer

**Difficulty:** Medium
**Estimated time:** 35–40 min
**Topics:** Tree flattening, lazy traversal, ARIA tree pattern, roving tabindex, derived search state, clipboard API, pagination of huge children lists

---

## Scenario

Every service in the media-operations console exposes its effective configuration as one JSON
document — a few hundred keys for a router, a 100 000-element `segments` array for a packager.
Engineers inspect it during incidents and today they get a `<pre>` with `JSON.stringify`: no
collapsing, no search, and the packager payload freezes the tab because every element is
rendered at once. Build the pure flattening and search helpers and a `JsonTree` component that
renders only what is expanded, follows the ARIA tree pattern, finds keys and values, and copies
a path to the clipboard so it can be pasted into a ticket.

## Requirements

1. **`flattenJson(value, { expanded, shown?, pageSize? })`** returns the rows to render, in
   depth-first display order:
   - `Row = { path, key, type, preview, depth, expandable, childCount }`. `path` is
     JSON-pointer-like without a leading slash (`''` for the root, `'a/0/b'` for nested
     values); `key` is the property name or array index as a string and `'root'` for the root;
     `type` is `'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'`.
   - `preview`: `{N keys}` / `{1 key}` / `{}` for objects, `[N items]` / `[1 item]` / `[]` for
     arrays, `JSON.stringify` for strings (`"text"`), `String(v)` otherwise (`42`, `true`,
     `null`). `expandable` is true for non-empty containers; `childCount` is the number of
     children.
   - Only the children of paths in `expanded` are emitted. A collapsed 100 000-element array
     costs exactly one row — do not walk children you will not emit.
   - **Paging (senior):** an expanded container emits at most `shown.get(path) ?? pageSize`
     (default `PAGE_SIZE = 100`) children, followed by one synthetic row
     `{ type: 'more', path: '<parent>/#more', key: '', preview: 'Show N more', depth + 1,
     expandable: false, childCount: remaining }` where `N = min(pageSize, remaining)`. No
     `more` row when everything is shown.
   - The root may be an object, an array or a primitive (senior).
2. **`searchPaths(value, query)`** returns the paths whose key segment or primitive value
   contains the trimmed query case-insensitively, in document order; `[]` for an empty query.
   Container previews never match. **`ancestorsOf(path)`** returns the paths that must be
   expanded to reveal it (`'a/0/b'` → `['', 'a', 'a/0']`).
3. **Tree rendering.** `<ul role="tree" aria-label="JSON">` with one `<li role="treeitem">` per
   row: `aria-level={depth + 1}`, `aria-expanded` only on expandable rows, and in its content
   the key, a type badge (the `type` string) and the preview. Containers at depth
   `< defaultExpandedDepth` (default 1) start expanded.
4. **Expand / collapse.** Click, `Enter` or `Space` toggle a container row. `ArrowRight`
   expands a collapsed container or moves to the first child of an open one; `ArrowLeft`
   collapses an open container or moves focus to the parent of anything else.
5. **Roving focus.** Exactly one `treeitem` has `tabIndex=0` (the active row, initially the
   root). `ArrowDown` / `ArrowUp` move focus to the next / previous visible row, `Home` / `End`
   to the first / last. When the active row disappears (its parent collapsed) the tab stop falls
   back to the first row. Focus follows programmatic moves (effect after commit, not inside the
   key handler).
6. **Search.** An `<input>` labelled `Search`. On each change: expand the ancestors of every
   match (rows stay expanded when the query is cleared), mark matching rows with the
   `data-match` attribute, and render `role="status"` reading `N matches` (`1 match`), empty
   when the query is blank.
7. **Copy path.** Each value row has a button named `Copy path` that calls
   `navigator.clipboard.writeText(path)` and must **not** toggle the row. Because the tree is a
   single tab stop, the buttons are `tabIndex={-1}`; pressing `c` on a focused row copies its
   path for keyboard users.
8. **Large arrays (senior).** Only the first 100 children render; the `more` row renders as a
   `treeitem` containing a button `Show N more`. Clicking it (or pressing `Enter` on the row)
   reveals the next page; the last page says `Show 50 more` for 50 remaining; no row once all
   are shown.

## Acceptance criteria

- [ ] Collapsed root → one row `{ '', 'root', 'object', '{6 keys}', 0, true, 6 }`.
- [ ] Expanded root → children in key order with the right type / preview / depth.
- [ ] Only children of expanded paths are emitted; `expanded = {'limits'}` without `''` yields
      one row; empty `{}` is not expandable.
- [ ] Array children use the index as key and path segment.
- [ ] **Senior:** 100k array collapsed → 1 row; expanded → `1 + 100 + 1` rows with a
      `Show 100 more` row (`childCount` 99 900); `shown '' → 300` gives 302 rows; 250 items
      with 200 shown → `Show 50 more`; fully shown → no `more` row.
- [ ] **Senior:** primitive roots (`42`, `'hi'`, `null`) and an array root flatten correctly.
- [ ] `searchPaths`: key match case-insensitive; string / number / boolean / null values match;
      `keys` / `items` never match; document order; blank → `[]`.
- [ ] `ancestorsOf` for nested, top-level and root paths.
- [ ] Tree named `JSON`, 7 treeitems for the sample at depth 1, `aria-level`, `aria-expanded`
      only on containers; key, badge and preview visible; `defaultExpandedDepth` 0 → 1 row,
      2 → 12 rows.
- [ ] Click toggles; Enter / ArrowRight / ArrowLeft behave per requirement 4.
- [ ] One tabbable row; Arrow / Home / End move it; collapsing the focused row's parent keeps a
      valid tab stop.
- [ ] Typing `es` reveals and marks `service`, `regions/0`, `limits/retries`, status
      `3 matches`; `zzz` → `0 matches`; clearing the query empties the status and keeps rows
      open.
- [ ] `Copy path` writes `limits`, `limits/maxBitrateKbps`, `''` for the root, without toggling;
      `c` on a focused row copies; copy buttons are not tab stops.
- [ ] **Senior:** 250-element root renders 102 treeitems, then 202, then 251; `End` reaches the
      `Show 50 more` row and `Enter` reveals the rest; a collapsed 100k root renders one row.

## Baseline a11y

- `role="tree"` with an accessible name; every row is a `treeitem` with `aria-level` (flat DOM
  with levels is an accepted tree pattern) and `aria-expanded` only where it means something.
- Single tab stop via roving `tabIndex`; all movement is arrow keys per the APG tree pattern.
- The search field has a visible `<label>`; the match count is a polite `role="status"`.
- The twisty glyph is `aria-hidden`; state comes from `aria-expanded`, not the glyph.
- Mouse-only affordances (`Copy path`) have a keyboard equivalent (`c`).

## Constraints

- No tree or virtualisation libraries. Rendering cost must be proportional to visible rows, not
  to document size.
- `flattenJson` must not iterate over the children of a collapsed container.
- Search runs over the whole document (that is fine — it is O(n) once per keystroke) but must
  not force every match's row into the DOM beyond the paging rule.
- No `useEffect` to synchronise `expanded` with the query; derive matches, mutate `expanded` in
  the change handler.

## Interviewer follow-ups

- A match sits at index 5 000 of an array that shows only 100 rows: the status says
  `1 match` but nothing is highlighted. Extend `shown` so search reveals it — what is the
  memory cost, and should search also scroll to it?
- Keys can contain `/` and `~`. Switch `path` to real RFC 6901 escaping (`~1`, `~0`) — which
  functions change and which tests break?
- The document is 50 MB and arrives streamed. What has to change for `flattenJson` to work
  over a partially parsed value, and how do you show "still loading" rows?
- Expanding 100 000 rows one page at a time is still 100 000 `<li>`s eventually. Where would you
  put the virtual list from task 087, and what does the tree pattern lose when rows are
  windowed?

## Say out loud

- **State shape first:** `expanded: Set<path>`, `shown: Map<path, number>`, `query`,
  `activePath`. Rows and matches are derived with `useMemo`; nothing is duplicated.
- **Race / cleanup hazard:** focus after expand/collapse. The target `<li>` may not exist until
  the commit, so I set a pending-focus ref and resolve it in an effect; and when the active row
  vanishes I fall back to the first row so the tree never loses its tab stop.
- **One data-shape question:** "Can keys contain `/`? If so my paths are ambiguous and I need
  JSON-pointer escaping."
- **One failure-handling question:** "`navigator.clipboard` is undefined over plain HTTP and
  rejects without a user gesture — do we show a toast, or fall back to a selectable text field?"
- **First test you'd write:** `flattenJson(bigArray, { expanded: new Set() })` has length 1 —
  the lazy-traversal guarantee before any UI.
