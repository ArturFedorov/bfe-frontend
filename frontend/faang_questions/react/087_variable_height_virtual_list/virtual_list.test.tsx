/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { FakeResizeObserver, installFakeObservers, restoreObservers } from '../_helpers/fake_observers';
import {
  VirtualList,
  VirtualListHandle,
  computeOffsets,
  findStartIndex,
} from './virtual_list';

interface Note {
  id: string;
  body: string;
}

const HEIGHT = 400;
const ESTIMATE = 40;
const OVERSCAN = 3;
// 400 / 40 = 10 visible rows. At the top: 10 + 3 below = 13. Mid-list: 10 + 3 + 3 = 16.
const MAX_ROWS = Math.ceil(HEIGHT / ESTIMATE) + 2 * OVERSCAN;

function makeNotes(count: number): Note[] {
  return Array.from({ length: count }, (_, i) => ({ id: `n${i}`, body: `Note ${i}` }));
}

function renderList(items: Note[], ref = createRef<VirtualListHandle>()) {
  const utils = render(
    <VirtualList<Note>
      ref={ref}
      items={items}
      renderItem={(item) => item.body}
      height={HEIGHT}
      estimateHeight={ESTIMATE}
      overscan={OVERSCAN}
      getKey={(item) => item.id}
    />,
  );
  const viewport = screen.getByRole('list');
  // jsdom has no layout: give the scroll container a real client height.
  Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: HEIGHT });
  const spacer = viewport.firstElementChild as HTMLElement;
  return { ...utils, ref, viewport, spacer };
}

function rows() {
  return screen.queryAllByRole('listitem');
}

function rowAt(index: number): HTMLElement {
  const row = rows().find((r) => r.getAttribute('aria-posinset') === String(index + 1));
  if (!row) throw new Error(`row ${index} is not rendered`);
  return row;
}

function scrollTo(viewport: HTMLElement, top: number) {
  viewport.scrollTop = top;
  fireEvent.scroll(viewport);
}

/** Report a measured height through whichever ResizeObserver observes the row. */
function reportHeight(row: Element, height: number) {
  const observer = FakeResizeObserver.instances.find((o) => o.observes(row));
  if (!observer) throw new Error('row is not observed by any ResizeObserver');
  act(() => observer.trigger(row, { height }));
}

beforeEach(() => installFakeObservers());
afterEach(() => restoreObservers());

describe('pure helpers', () => {
  it('computeOffsets returns prefix sums with a leading 0 and the total last', () => {
    expect(computeOffsets([])).toEqual([0]);
    expect(computeOffsets([10, 20, 30])).toEqual([0, 10, 30, 60]);
    expect(computeOffsets([40])).toEqual([0, 40]);
  });

  it('findStartIndex returns the row containing scrollTop (boundary inclusive)', () => {
    const offsets = computeOffsets([10, 20, 30]); // [0, 10, 30, 60]
    expect(findStartIndex(offsets, 0)).toBe(0);
    expect(findStartIndex(offsets, 9)).toBe(0);
    expect(findStartIndex(offsets, 10)).toBe(1);
    expect(findStartIndex(offsets, 29)).toBe(1);
    expect(findStartIndex(offsets, 30)).toBe(2);
    expect(findStartIndex(offsets, 59)).toBe(2);
  });

  it('findStartIndex clamps past the end and handles an empty list', () => {
    expect(findStartIndex(computeOffsets([10, 20, 30]), 1000)).toBe(2);
    expect(findStartIndex([0], 0)).toBe(0);
    expect(findStartIndex([0], 500)).toBe(0);
  });

  it('findStartIndex is exact on a large uniform list (binary search, not a scan)', () => {
    const offsets = computeOffsets(new Array(100_000).fill(40));
    expect(findStartIndex(offsets, 10_000)).toBe(250);
    expect(findStartIndex(offsets, 10_039)).toBe(250);
    expect(findStartIndex(offsets, 10_040)).toBe(251);
    expect(findStartIndex(offsets, 3_999_999)).toBe(99_999);
  });
});

describe('1. windowing', () => {
  it('mounts 100k items but renders only the first window', () => {
    renderList(makeNotes(100_000));
    const rendered = rows();
    expect(rendered).toHaveLength(13);
    expect(screen.getByText('Note 0')).toBeInTheDocument();
    expect(screen.getByText('Note 12')).toBeInTheDocument();
    expect(screen.queryByText('Note 13')).not.toBeInTheDocument();
  });

  it('renders visible + overscan rows after scrolling to the middle', () => {
    const { viewport } = renderList(makeNotes(100_000));
    scrollTo(viewport, 10_000); // first visible row = 250
    const rendered = rows();
    expect(rendered.length).toBeLessThanOrEqual(MAX_ROWS);
    expect(screen.getByText('Note 247')).toBeInTheDocument(); // overscan above
    expect(screen.getByText('Note 250')).toBeInTheDocument();
    expect(screen.getByText('Note 259')).toBeInTheDocument();
    expect(screen.getByText('Note 262')).toBeInTheDocument(); // overscan below
    expect(screen.queryByText('Note 246')).not.toBeInTheDocument();
    expect(screen.queryByText('Note 263')).not.toBeInTheDocument();
    expect(screen.queryByText('Note 0')).not.toBeInTheDocument();
  });

  it('positions rows absolutely at their offset with aria-setsize/posinset', () => {
    renderList(makeNotes(1000));
    const row = rowAt(5);
    expect(row).toHaveStyle({ position: 'absolute', top: '200px' });
    expect(row).toHaveAttribute('aria-setsize', '1000');
    expect(row).toHaveAttribute('aria-posinset', '6');
  });

  it('uses overscan 3 by default', () => {
    render(
      <VirtualList<Note>
        items={makeNotes(1000)}
        renderItem={(item) => item.body}
        height={HEIGHT}
        estimateHeight={ESTIMATE}
        getKey={(item) => item.id}
      />,
    );
    expect(rows()).toHaveLength(13);
  });
});

describe('2. spacer height', () => {
  it('sizes the spacer from the estimate before any measurement', () => {
    const { viewport, spacer } = renderList(makeNotes(100_000));
    expect(viewport).toHaveStyle({ height: '400px' });
    expect(spacer).toHaveStyle({ height: '4000000px' });
  });

  it('grows the spacer by the measured delta', () => {
    const { spacer } = renderList(makeNotes(1000));
    reportHeight(rowAt(2), 100);
    expect(spacer).toHaveStyle({ height: `${1000 * 40 + 60}px` });
  });
});

describe('3. measurement via ResizeObserver', () => {
  it('observes every rendered row', () => {
    renderList(makeNotes(1000));
    for (const row of rows()) {
      expect(FakeResizeObserver.instances.some((o) => o.observes(row))).toBe(true);
    }
  });

  it('shifts the rows below a measured row by the delta', () => {
    renderList(makeNotes(1000));
    expect(rowAt(3)).toHaveStyle({ top: '120px' });
    reportHeight(rowAt(2), 100);
    expect(rowAt(2)).toHaveStyle({ top: '80px' });
    expect(rowAt(3)).toHaveStyle({ top: '180px' });
    expect(rowAt(1)).toHaveStyle({ top: '40px' });
  });

  it('ignores a reported height of 0', () => {
    const { spacer } = renderList(makeNotes(1000));
    reportHeight(rowAt(2), 0);
    expect(rowAt(3)).toHaveStyle({ top: '120px' });
    expect(spacer).toHaveStyle({ height: '40000px' });
  });

  it('stops observing rows after unmount', () => {
    const { unmount } = renderList(makeNotes(1000));
    const first = rowAt(0);
    expect(FakeResizeObserver.instances.some((o) => o.observes(first))).toBe(true);
    unmount();
    expect(FakeResizeObserver.instances.some((o) => o.observes(first))).toBe(false);
  });
});

describe('4. heights cached by key', () => {
  it('keeps a measured height attached to its item after a prepend', () => {
    const items = makeNotes(1000);
    const { rerender } = renderList(items);
    reportHeight(rowAt(5), 100); // n5 -> 100
    expect(rowAt(6)).toHaveStyle({ top: '300px' }); // 5 * 40 + 100

    const prepended = [{ id: 'new', body: 'Note new' }, ...items];
    rerender(
      <VirtualList<Note>
        items={prepended}
        renderItem={(item) => item.body}
        height={HEIGHT}
        estimateHeight={ESTIMATE}
        overscan={OVERSCAN}
        getKey={(item) => item.id}
      />,
    );

    // n5 is now index 6 and still 100px tall; n6 is index 7.
    expect(screen.getByText('Note 5')).toHaveAttribute('aria-posinset', '7');
    expect(screen.getByText('Note 5').closest('[role="listitem"]')).toHaveStyle({ top: '240px' });
    expect(screen.getByText('Note 6').closest('[role="listitem"]')).toHaveStyle({ top: '340px' });
    expect(screen.getByText('Note new')).toHaveAttribute('aria-setsize', '1001');
  });
});

describe('5. scroll anchoring', () => {
  it('does not change scrollTop when a row inside the viewport grows', () => {
    const { viewport, ref } = renderList(makeNotes(1000));
    act(() => ref.current!.scrollToIndex(50));
    expect(viewport.scrollTop).toBe(2000);
    reportHeight(rowAt(55), 80);
    expect(viewport.scrollTop).toBe(2000);
    expect(rowAt(50)).toHaveStyle({ top: '2000px' });
    expect(rowAt(56)).toHaveStyle({ top: `${56 * 40 + 40}px` });
  });
});

describe('6. scrollToIndex', () => {
  it("'start' puts the row at the top of the viewport and renders its window", () => {
    const { viewport, ref } = renderList(makeNotes(1000));
    act(() => ref.current!.scrollToIndex(500));
    expect(viewport.scrollTop).toBe(20_000);
    expect(rowAt(500)).toHaveStyle({ top: '20000px' });
    expect(screen.getByText('Note 497')).toBeInTheDocument();
    expect(screen.queryByText('Note 0')).not.toBeInTheDocument();
  });

  it("'center' centers the row in the viewport", () => {
    const { viewport, ref } = renderList(makeNotes(1000));
    act(() => ref.current!.scrollToIndex(500, 'center'));
    expect(viewport.scrollTop).toBe(19_820); // 20000 - (400 - 40) / 2
    expect(screen.getByText('Note 500')).toBeInTheDocument();
  });

  it('uses measured heights, not estimates, for the target offset', () => {
    const { viewport, ref } = renderList(makeNotes(1000));
    reportHeight(rowAt(2), 100);
    act(() => ref.current!.scrollToIndex(10));
    expect(viewport.scrollTop).toBe(10 * 40 + 60);
  });

  it('clamps negative and out-of-range indices', () => {
    const { viewport, ref } = renderList(makeNotes(1000));
    act(() => ref.current!.scrollToIndex(-5));
    expect(viewport.scrollTop).toBe(0);
    act(() => ref.current!.scrollToIndex(5000));
    expect(viewport.scrollTop).toBe(1000 * 40 - HEIGHT);
    expect(screen.getByText('Note 999')).toBeInTheDocument();
  });
});

describe('7. scroll events', () => {
  it('moves the window with scrollTop and restores the first window at 0', () => {
    const { viewport } = renderList(makeNotes(1000));
    scrollTo(viewport, 4000);
    expect(screen.getByText('Note 100')).toBeInTheDocument();
    expect(screen.queryByText('Note 0')).not.toBeInTheDocument();
    scrollTo(viewport, 0);
    expect(rows()).toHaveLength(13);
    expect(screen.getByText('Note 0')).toBeInTheDocument();
    expect(screen.queryByText('Note 100')).not.toBeInTheDocument();
  });
});

describe('8. empty list', () => {
  it('renders no rows and a 0px spacer', () => {
    const { spacer, ref } = renderList([]);
    expect(rows()).toHaveLength(0);
    expect(spacer).toHaveStyle({ height: '0px' });
    expect(() => act(() => ref.current!.scrollToIndex(3))).not.toThrow();
  });
});

describe('senior', () => {
  it('anchors the viewport when an overscan row above it is measured taller', () => {
    const { viewport, ref } = renderList(makeNotes(1000));
    act(() => ref.current!.scrollToIndex(50));
    expect(viewport.scrollTop).toBe(2000);
    expect(rowAt(50)).toHaveStyle({ top: '2000px' });

    // Row 47 is rendered (overscan) but fully above the viewport. It turns
    // out to be 80px, not 40px: everything below shifts by +40, including
    // row 50 — scrollTop must follow so row 50 stays at the top.
    reportHeight(rowAt(47), 80);

    expect(viewport.scrollTop).toBe(2040);
    expect(rowAt(50)).toHaveStyle({ top: '2040px' });
    // The first row at or below the viewport top is still row 50.
    const firstVisible = rows()
      .map((r) => ({ r, top: parseFloat(r.style.top) }))
      .filter(({ top }) => top >= viewport.scrollTop)
      .sort((a, b) => a.top - b.top)[0];
    expect(firstVisible.r).toHaveAttribute('aria-posinset', '51');

    // A row inside the viewport growing afterwards still leaves scrollTop alone.
    reportHeight(rowAt(52), 120);
    expect(viewport.scrollTop).toBe(2040);
  });

  it('scrollToIndex(99_999) renders the last rows of a 100k list within the DOM budget', () => {
    const { viewport, ref } = renderList(makeNotes(100_000));
    act(() => ref.current!.scrollToIndex(99_999));
    expect(viewport.scrollTop).toBe(100_000 * 40 - HEIGHT);
    const rendered = rows();
    expect(rendered.length).toBeLessThanOrEqual(MAX_ROWS);
    expect(rendered.length).toBeGreaterThan(0);
    expect(screen.getByText('Note 99999')).toHaveAttribute('aria-posinset', '100000');
    expect(screen.getByText('Note 99990')).toBeInTheDocument();
    expect(screen.queryByText('Note 0')).not.toBeInTheDocument();
  });
});
