# 045. Virtualized List

Difficulty: Hard
Topics: windowing, scroll handling, DOM budget, overscan, fixed-height rows

## Scenario

The playback-diagnostics tool shows a delivery's log stream — 50,000 lines. Rendering 50k DOM nodes freezes the tab for seconds and scrolling stutters permanently. You may not add a library (`react-window` is banned in this interview): build the windowing yourself.

Unlike the other Topic 6 tasks, this one starts from an **empty stub** — `LogViewer` in `virtualized_list.tsx` returns `null` and you implement it from scratch. The idea: render only the rows that intersect the viewport (plus `overscan` rows above and below), absolutely positioned inside a spacer element whose height is `logs.length * rowHeight`, so the scrollbar behaves as if all rows existed.

### Contract (the tests query exactly this)

- Outer scroll container: `data-testid="log-viewport"`, `style.height = height`, `overflowY: auto`, updates the window from its own `scrollTop` on scroll events.
- Inner spacer: `data-testid="log-spacer"`, `role="list"`, `position: relative`, `style.height = logs.length * rowHeight`.
- Each rendered row: `role="listitem"`, `position: absolute`, `top = index * rowHeight`, `height = rowHeight`, text content `logs[index]`.
- Window = `[max(0, floor(scrollTop / rowHeight) - overscan), min(logs.length, ceil((scrollTop + height) / rowHeight) + overscan))`.

### Render-count convention

Call the probe `onRender?.('row-<index>')` once for each row you render on each pass. The tests use it to prove off-window rows are never even rendered, not merely hidden.

## Acceptance Criteria

- With `height=400`, `rowHeight=20`, `overscan=5`, 50k logs: mount renders exactly 25 list items (rows 0–24); `log 25` is not in the DOM.
- Spacer height is exactly `1000000px`; viewport height `400px`.
- Setting `scrollTop = 10000` and firing a scroll event yields exactly 30 items — rows 495–524; rows 494 and 525 are absent.
- Row offsets/heights are index-derived and stable: `log 500` sits at `top: 10000px; height: 20px` regardless of scroll history.
- Window clamps at both edges (25 items at the very top and very bottom; `log 49999` reachable).
- Scrolling back up restores the top window — the window is pure function of `scrollTop`.

## Example

```tsx
render(<LogViewer logs={LOGS} height={400} rowHeight={20} overscan={5} />);
const viewport = screen.getByTestId('log-viewport');
viewport.scrollTop = 10000;
fireEvent.scroll(viewport);
expect(screen.getAllByRole('listitem')).toHaveLength(30);
expect(screen.getByText('log 495')).toBeInTheDocument();
expect(screen.queryByText('log 0')).not.toBeInTheDocument();
```

## Target

DOM budget: at most `ceil(height / rowHeight) + 2 * overscan` list items in the document at any moment (here ≤ 30), independent of `logs.length` — O(viewport), never O(n). Render budget: a scroll event re-renders one component and creates O(window) elements; rows outside the window are never rendered at all (probe-verified). Memory: no per-row state, no caching of all 50k elements.

## Interviewer follow-up

- Your window math uses `floor`/`ceil` with an exclusive end. Off-by-one audit: what breaks visually if you use `floor` for the end index, and at which scrollTop values would a user notice?
- What does `overscan` actually buy at 60fps scrolling, and what is the cost of setting it to 50?
- Rows here are fixed-height. Sketch the design change for variable-height rows — what replaces `index * rowHeight`, and why does this get so much harder?
- Scroll events fire faster than React commits. Is `setScrollTop` on every event a problem? When would you reach for `requestAnimationFrame` batching or `useDeferredValue`?
- The absolute-positioning approach is one of two classics; the other is a single translated inner div with top/bottom padding (or transform). Trade-offs?
