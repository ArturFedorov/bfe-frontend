# 087. Variable-Height Virtual List

**Difficulty:** Very Hard
**Estimated time:** 60 min
**Topics:** Windowing, ResizeObserver, Scroll Anchoring, Imperative Handles, Prefix Sums, Binary Search

---

## Scenario

The review queue's "all comments on this task" drawer shows every QA note,
model explanation and agent log line for an annotation task — tens of
thousands of entries for the busiest tasks, each a different height because
they wrap, embed code blocks, or expand inline diffs. The fixed-height
virtualizer from 045 produced the wrong total height, rows overlapped after a
comment expanded, and the content jumped whenever an item above the viewport
finished loading an image. Build a virtual list that measures rows after they
render, caches their heights by key, keeps the scrollbar honest, and anchors
the viewport so content never jumps under the reviewer's eyes.

## Contract

```tsx
interface VirtualListHandle {
  scrollToIndex(index: number, align?: 'start' | 'center'): void;
}

<VirtualList<T>
  ref={handleRef}                      // React 19: ref is a regular prop
  items={items}
  renderItem={(item, index) => <Comment {...item} />}
  height={400}                         // viewport height in px
  estimateHeight={40}                  // used until a row is measured
  overscan={3}                         // default 3
  getKey={(item) => item.id}           // heights are cached by this key
/>
```

Pure helpers (exported, unit-tested directly):

```ts
computeOffsets(heights: number[]): number[]
// prefix sums with a leading 0: [10, 20, 30] -> [0, 10, 30, 60]
// length = heights.length + 1; last entry = total height

findStartIndex(offsets: number[], scrollTop: number): number
// binary search: the largest i such that offsets[i] <= scrollTop,
// clamped to [0, heights.length - 1]; 0 for an empty list
```

### DOM shape (the tests query exactly this)

- Scroll container: `role="list"`, `tabIndex={0}`, `style.height = height`,
  `overflowY: auto`. Tests set `scrollTop` on it, define `clientHeight`, and
  fire `scroll` events on it.
- Inside it one spacer (`role="presentation"`, `position: relative`) whose
  `style.height` is the sum of all measured-or-estimated heights.
- Each rendered row: `role="listitem"`, `aria-setsize={items.length}`,
  `aria-posinset={index + 1}`, `position: absolute`, `top = offsets[index]`.
  No fixed `height` style — the row's content decides.
- Window: `start = findStartIndex(offsets, scrollTop)`;
  `end` = smallest index with `offsets[end] >= scrollTop + height`
  (exclusive, clamped to `items.length`);
  rendered range = `[max(0, start - overscan), min(items.length, end + overscan))`.

## Requirements

1. **Windowing.** Only rows in the rendered range exist in the DOM. With
   `height=400`, `estimateHeight=40`, `overscan=3` and 100k items, mount
   renders rows 0–12 (13 rows); at `scrollTop=10000` rows 247–262 (16 rows).
   The DOM budget is `ceil(height / estimateHeight) + 2 * overscan` rows
   while heights are unmeasured.
2. **Spacer height.** `items.length * estimateHeight` before any measurement;
   after a row is measured the spacer grows or shrinks by the delta.
3. **Measurement.** Every rendered row is observed by a `ResizeObserver`
   (one instance is fine). On a resize entry, store the row's height under
   `getKey(item)`, recompute offsets and re-render. Ignore entries that
   report `0` (jsdom, `display:none`). Unobserve rows that leave the window;
   disconnect on unmount.
4. **Cache by key, not index.** Prepending an item must keep every measured
   height attached to the same item (its `top` shifts by the new row's
   height; its own height is unchanged).
5. **Scroll anchoring.** If a row whose index is `< start` (fully above the
   viewport) changes height by `delta`, add `delta` to the container's
   `scrollTop` and to the internal scroll position in the same update, so
   the row at the top of the viewport stays at the top. A row inside or
   below the viewport changing height must not touch `scrollTop`.
6. **`scrollToIndex(index, align = 'start')`.** `'start'` sets `scrollTop =
   offsets[index]`; `'center'` sets
   `scrollTop = offsets[index] - (height - rowHeight) / 2`. Clamp the index
   to `[0, items.length - 1]` and the result to `[0, totalHeight - height]`.
   Update the container's `scrollTop` and the rendered window synchronously
   (do not wait for a `scroll` event).
7. **Scroll events.** On `scroll`, read `scrollTop` from the container and
   re-render the window. Scrolling back to 0 restores the first window.
8. **Empty list.** No rows, spacer height `0px`, no crash.

## Acceptance Criteria

- [ ] `computeOffsets([])` → `[0]`; `computeOffsets([10, 20, 30])` → `[0, 10, 30, 60]`.
- [ ] `findStartIndex` returns the row containing `scrollTop` (boundary
      inclusive), clamps past the end, returns `0` for `[0]`.
- [ ] Mount with 100k items renders exactly 13 rows and the spacer is
      `4000000px`; `scrollTop=10000` renders 16 rows including 247 and 262.
- [ ] Rows carry `role="listitem"`, `aria-setsize`, `aria-posinset`, `top`.
- [ ] Every rendered row is observed by a `ResizeObserver`; after unmount
      nothing is observed.
- [ ] Measuring row 2 as 100px moves row 3's `top` by +60 and grows the
      spacer by 60.
- [ ] Heights survive a prepend (cached by key).
- [ ] `scrollToIndex(500)` → `scrollTop = 20000`, row 500 at the top;
      `scrollToIndex(500, 'center')` → `scrollTop = 19820`.
- [ ] Scrolling back to 0 restores rows 0–12.
- [ ] Empty list renders no rows and a `0px` spacer.
- [ ] Senior: after `scrollToIndex(50)`, reporting overscan row 47 as 80px
      (instead of the 40px estimate) moves `scrollTop` from 2000 to 2040 and
      row 50 is still exactly at the top (`top === scrollTop`); reporting
      row 55 (inside the viewport) as 80px leaves `scrollTop` unchanged.
- [ ] Senior: `scrollToIndex(99_999)` clamps to `totalHeight - height`,
      renders row 99 999 (`aria-posinset="100000"`) and at most 16 rows.

## Baseline a11y

- Container is `role="list"` and focusable (`tabIndex={0}`) so keyboard
  users can scroll it.
- Rows are `role="listitem"` with `aria-setsize` / `aria-posinset` so a
  screen reader announces "item 251 of 100000" even though only 16 rows
  exist in the DOM.
- The spacer is `role="presentation"` so it does not break the list →
  listitem ownership.

## Constraints

- React only — no `react-window`, `react-virtual`, etc.
- Never render all items; never read `offsetHeight` of every item up front.
- O(n) per render over heights is acceptable (prefix sums); avoid O(n) DOM.
- Do not depend on real layout: heights come only from `ResizeObserver`
  entries (`borderBoxSize[0].blockSize` or `contentRect.height`).

## Interviewer follow-ups (talk-through only)

- The prefix-sum rebuild is O(n) per measurement. At 100k rows and 60
  measurements per second during a fast scroll, what breaks first — and
  when would you switch to a Fenwick tree or chunked offsets?
- Scroll anchoring here is done by the component. Browsers have CSS
  `overflow-anchor`. Why can't you rely on it with absolutely positioned
  rows, and what would you have to change to let the browser do it?
- `estimateHeight` is a constant. How would you learn a better estimate
  from measured rows, and what happens to `scrollToIndex(99_999)` while
  rows between the current window and the target are still unmeasured?
- Keyboard users press `ArrowDown` inside a row. Focus moves to a row that
  gets unmounted on the next scroll. How do you keep focus stable —
  `aria-activedescendant` on the container, or a focus-restoring effect?

## Say out loud

- State shape first: `scrollTop: number` in state; `heights: Map<key, number>`
  in a ref (not state — it changes outside React and must not trigger a
  render per entry); `offsets` derived every render.
- Name the hazard: the ResizeObserver callback runs after the row was
  positioned with an estimated `top`; if the row is above the viewport, the
  correction shifts everything below it — anchoring must apply the delta to
  `scrollTop` in the same update or the user sees a jump.
- Ask one data-shape question: are keys stable across refetches, and can two
  items ever share a key?
- Ask one failure-handling question: what should happen when a row reports
  a height of 0 (hidden tab, `display:none`) — keep the old height or
  collapse the row?
- Name the first test you would write: `computeOffsets([10, 20, 30])` →
  `[0, 10, 30, 60]`, then `findStartIndex` at the boundaries.
