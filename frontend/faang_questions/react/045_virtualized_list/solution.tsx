import { UIEvent, useState } from 'react';

export type LogViewerProps = {
  /** All log lines (can be 50k+). */
  logs: string[];
  /** Viewport height in px. */
  height: number;
  /** Fixed row height in px — every row must render at exactly this height. */
  rowHeight: number;
  /** Extra rows rendered above and below the visible range. */
  overscan: number;
  /** Render probe: call once per rendered row as `row-<index>`. */
  onRender?: (id: string) => void;
};

/**
 * Fixed-row-height windowing (virtualization) with no library.
 *
 * How it works:
 * - The outer element is the scroll container with a fixed `height`.
 * - The inner "spacer" is `logs.length * rowHeight` tall and `position:
 *   relative`, so the scrollbar is honest about the total content size even
 *   though only a handful of rows exist in the DOM.
 * - Each rendered row is absolutely positioned at `top = index * rowHeight`.
 *   Offsets are derived from the index alone, so they are stable regardless of
 *   scroll history and never need measuring.
 * - The window is a pure function of `scrollTop`:
 *     start = max(0, floor(scrollTop / rowHeight) - overscan)
 *     end   = min(n, ceil((scrollTop + height) / rowHeight) + overscan)   (exclusive)
 *   `ceil` for the end matters: a partially visible last row must still be
 *   rendered, otherwise the user sees a blank strip at the bottom whenever
 *   `scrollTop + height` is not a multiple of `rowHeight`.
 * - `overscan` rows above/below hide the blank flash between a scroll event and
 *   the next commit at fast scroll speeds; it costs O(overscan) extra nodes.
 *
 * DOM budget: at most ceil(height / rowHeight) + 2 * overscan list items,
 * independent of `logs.length`. No per-row state, nothing cached per row.
 */
export function LogViewer({ logs, height, rowHeight, overscan, onRender }: LogViewerProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const total = logs.length;
  const firstVisible = Math.floor(scrollTop / rowHeight);
  const lastVisibleExclusive = Math.ceil((scrollTop + height) / rowHeight);
  const start = Math.max(0, firstVisible - overscan);
  const end = Math.min(total, lastVisibleExclusive + overscan);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    // Reading scrollTop from the event target keeps this a pure
    // "scroll position -> window" mapping. React batches these updates; for
    // very high event rates one could additionally coalesce via rAF or
    // useDeferredValue, but a single state update per event is already O(window).
    setScrollTop(event.currentTarget.scrollTop);
  };

  const rows = [];
  for (let index = start; index < end; index++) {
    onRender?.(`row-${index}`);
    rows.push(
      <div
        key={index}
        role="listitem"
        style={{
          position: 'absolute',
          top: index * rowHeight,
          left: 0,
          right: 0,
          height: rowHeight,
          boxSizing: 'border-box',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {logs[index]}
      </div>,
    );
  }

  return (
    <div
      data-testid="log-viewport"
      onScroll={handleScroll}
      style={{ height, overflowY: 'auto', position: 'relative' }}
    >
      <div
        data-testid="log-spacer"
        role="list"
        style={{ position: 'relative', height: total * rowHeight }}
      >
        {rows}
      </div>
    </div>
  );
}
