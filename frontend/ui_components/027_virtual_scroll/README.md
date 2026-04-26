# 27. Virtual Scroll List

**Difficulty:** Hard
**Topics:** DOM recycling, scroll math, performance

---

## Description

Build a virtual-scrolling list. The component renders only the rows currently visible in the viewport (plus a small overscan buffer) and reuses DOM nodes as the user scrolls. The total scrollable height matches as if every row were rendered.

This task assumes **fixed row height** for simplicity. (A follow-up could handle dynamic heights with `ResizeObserver`.)

## Requirements

- Renders a scrollable container of fixed pixel `height`
- Only renders rows currently in view (plus `overscan` extra rows above/below)
- Total scrollable height = `items.length * itemHeight` so the scrollbar is correct
- Visible rows are positioned absolutely at `top: index * itemHeight`
- `setItems(items)` updates the data and re-renders
- `scrollToIndex(index)` scrolls so the row is in view
- `getVisibleRange()` returns `{ start, end }` of currently rendered indices
- Caller-supplied `renderItem(item, index)` returns a string or `HTMLElement`
- `destroy()` removes elements and listeners

## Examples

```ts
const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, text: `Row ${i}` }));

const list = createVirtualScroll({
  container: document.getElementById('list')!,
  items,
  itemHeight: 30,
  height: 300,
  renderItem: (item) => `<div>${item.text}</div>`,
});

list.scrollToIndex(5000);
list.getVisibleRange(); // { start: 5000, end: 5010 }
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Two-layer DOM: an outer scrollable container with <code>overflow-y: auto</code>, and an inner spacer of height <code>items.length * itemHeight</code>. Visible rows are absolutely positioned children of the spacer.
</details>

<details>
<summary>Hint 2</summary>
On <code>scroll</code>, compute <code>start = Math.floor(scrollTop / itemHeight) - overscan</code> and <code>end = start + visibleCount + 2 * overscan</code>. Clamp to <code>[0, items.length]</code>.
</details>

<details>
<summary>Hint 3</summary>
For real performance, recycle DOM nodes: keep a pool sized to <code>visibleCount + 2*overscan</code>, and on each scroll, reassign each pool node's <code>top</code> + content to the new index — don't <code>innerHTML = ''</code> + rebuild.
</details>
