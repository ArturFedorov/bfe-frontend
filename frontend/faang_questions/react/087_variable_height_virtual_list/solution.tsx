import React, {
  ReactElement,
  ReactNode,
  Ref,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

export type ScrollAlign = 'start' | 'center';

export interface VirtualListHandle {
  scrollToIndex(index: number, align?: ScrollAlign): void;
}

export interface VirtualListProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Viewport height in px. */
  height: number;
  /** Height assumed for a row until it has been measured. */
  estimateHeight: number;
  /** Extra rows rendered above and below the viewport. Default 3. */
  overscan?: number;
  /** Stable key per item; measured heights are cached by this key. */
  getKey: (item: T) => string;
  ref?: Ref<VirtualListHandle>;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Prefix sums with a leading 0: [10, 20, 30] -> [0, 10, 30, 60].
 * Length is heights.length + 1; the last entry is the total height.
 */
export function computeOffsets(heights: readonly number[]): number[] {
  const offsets = new Array<number>(heights.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < heights.length; i++) offsets[i + 1] = offsets[i] + heights[i];
  return offsets;
}

/**
 * Binary search: the largest index i such that offsets[i] <= scrollTop,
 * clamped to [0, heights.length - 1]. Returns 0 for an empty list.
 */
export function findStartIndex(offsets: readonly number[], scrollTop: number): number {
  const count = offsets.length - 1; // number of rows
  if (count <= 0) return 0;
  let lo = 0;
  let hi = count - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1; // bias up so we converge on the largest match
    if (offsets[mid] <= scrollTop) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Smallest index with offsets[end] >= bottom, clamped to the row count (exclusive end). */
function findEndIndex(offsets: readonly number[], bottom: number): number {
  const count = offsets.length - 1;
  let lo = 0;
  let hi = count;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid] >= bottom) hi = mid;
    else lo = mid + 1;
  }
  return Math.min(lo, count);
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Snapshot of the latest render, read by the ResizeObserver callback and the handle. */
interface Latest {
  keys: string[];
  indexByKey: Map<string, number>;
  offsets: number[];
  scrollTop: number;
  start: number;
  height: number;
  estimateHeight: number;
}

/**
 * Variable-height windowed list.
 *
 * - `scrollTop` is React state (drives the window). Measured heights live in a
 *   ref keyed by `getKey(item)` — they change outside React and are cached
 *   across reorders/prepends; a tick counter re-renders after a measurement.
 * - `offsets` (prefix sums) are derived every render; `findStartIndex` is a
 *   binary search so the window is O(log n) to locate.
 * - One ResizeObserver measures every rendered row; rows leaving the window
 *   are unobserved, and the observer is disconnected on unmount.
 * - Scroll anchoring: when a row *above* the viewport changes height, the
 *   delta is added to the container's scrollTop and to state in the same
 *   update, so the row at the top of the viewport does not move.
 */
export function VirtualList<T>({
  items,
  renderItem,
  height,
  estimateHeight,
  overscan = 3,
  getKey,
  ref,
}: VirtualListProps<T>): ReactElement {
  const [scrollTop, setScrollTop] = useState(0);
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const heightsRef = useRef(new Map<string, number>());
  const observerRef = useRef<ResizeObserver | null>(null);
  /** Rendered row elements by key (filled by ref callbacks). */
  const rowElsRef = useRef(new Map<string, HTMLElement>());
  /** Elements currently observed → their key. */
  const observedRef = useRef(new Map<Element, string>());
  const latestRef = useRef<Latest | null>(null);

  // --- derive geometry for this render --------------------------------------
  const keys = items.map(getKey);
  const heights = keys.map((key) => heightsRef.current.get(key) ?? estimateHeight);
  const offsets = computeOffsets(heights);
  const totalHeight = offsets[offsets.length - 1];

  const start = findStartIndex(offsets, scrollTop);
  const end = findEndIndex(offsets, scrollTop + height);
  const renderFrom = Math.max(0, start - overscan);
  const renderTo = Math.min(items.length, end + overscan);

  // Snapshot for callbacks that run after commit.
  useLayoutEffect(() => {
    const indexByKey = new Map<string, number>();
    keys.forEach((key, i) => indexByKey.set(key, i));
    latestRef.current = { keys, indexByKey, offsets, scrollTop, start, height, estimateHeight };
  });

  // --- measurement ----------------------------------------------------------
  const onResize = (entries: ResizeObserverEntry[]) => {
    const latest = latestRef.current;
    if (!latest) return;
    let anchorDelta = 0;
    let changed = false;

    for (const entry of entries) {
      const key = observedRef.current.get(entry.target);
      if (key === undefined) continue;
      const measured = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      if (!measured) continue; // 0 → hidden / jsdom: keep the previous height

      const previous = heightsRef.current.get(key) ?? latest.estimateHeight;
      if (measured === previous) continue;
      heightsRef.current.set(key, measured);
      changed = true;

      // Rows fully above the viewport push everything below them: anchor.
      const index = latest.indexByKey.get(key);
      if (index !== undefined && index < latest.start) anchorDelta += measured - previous;
    }

    if (!changed) return;
    if (anchorDelta !== 0) {
      const next = latest.scrollTop + anchorDelta;
      if (viewportRef.current) viewportRef.current.scrollTop = next;
      setScrollTop(next);
    }
    rerender();
  };

  // Keep the observed set equal to the rendered rows (after every render).
  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    if (!observerRef.current) observerRef.current = new ResizeObserver(onResize);
    const observer = observerRef.current;
    const rendered = rowElsRef.current;
    const observed = observedRef.current;

    for (const [el, key] of Array.from(observed.entries())) {
      if (rendered.get(key) !== el) {
        observer.unobserve(el);
        observed.delete(el);
      }
    }
    for (const [key, el] of rendered) {
      if (!observed.has(el)) {
        observer.observe(el);
        observed.set(el, key);
      }
    }
  });

  // Disconnect on unmount.
  useLayoutEffect(
    () => () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      observedRef.current.clear();
    },
    [],
  );

  // --- imperative handle ----------------------------------------------------
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex(index: number, align: ScrollAlign = 'start') {
        const latest = latestRef.current;
        if (!latest || latest.keys.length === 0) return;
        const i = clamp(index, 0, latest.keys.length - 1);
        const rowHeight = latest.offsets[i + 1] - latest.offsets[i];
        const total = latest.offsets[latest.offsets.length - 1];
        const raw = align === 'center' ? latest.offsets[i] - (latest.height - rowHeight) / 2 : latest.offsets[i];
        const next = clamp(raw, 0, Math.max(0, total - latest.height));
        if (viewportRef.current) viewportRef.current.scrollTop = next;
        setScrollTop(next); // update the window synchronously; don't wait for `scroll`
      },
    }),
    [],
  );

  // --- render ---------------------------------------------------------------
  const rows: ReactNode[] = [];
  for (let i = renderFrom; i < renderTo; i++) {
    const key = keys[i];
    rows.push(
      <div
        key={key}
        role="listitem"
        aria-setsize={items.length}
        aria-posinset={i + 1}
        ref={(el) => {
          if (el) rowElsRef.current.set(key, el);
          else rowElsRef.current.delete(key);
        }}
        style={{ position: 'absolute', top: `${offsets[i]}px`, left: 0, right: 0 }}
      >
        {renderItem(items[i], i)}
      </div>,
    );
  }

  return (
    <div
      ref={viewportRef}
      role="list"
      tabIndex={0}
      style={{ height: `${height}px`, overflowY: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div role="presentation" style={{ position: 'relative', height: `${totalHeight}px` }}>
        {rows}
      </div>
    </div>
  );
}
