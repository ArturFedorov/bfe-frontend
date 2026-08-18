/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { LogViewer } from './virtualized_list';

// 50k logs, 400px viewport, 20px rows, overscan 5.
// Visible rows = 400 / 20 = 20. Window at top = rows 0..24 (20 + 5 below).
// Mid-list window = 20 + 5 above + 5 below = 30 rows.
const LOGS = Array.from({ length: 50000 }, (_, i) => `log ${i}`);
const PROPS = { logs: LOGS, height: 400, rowHeight: 20, overscan: 5 };

function scrollTo(top: number) {
  const viewport = screen.getByTestId('log-viewport');
  viewport.scrollTop = top;
  fireEvent.scroll(viewport);
}

describe('045 virtualized list — DOM budget', () => {
  it('mounts with only the first window in the DOM, not 50k nodes', () => {
    render(<LogViewer {...PROPS} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(25); // 20 visible + 5 overscan below (none above at top)
    expect(screen.getByText('log 0')).toBeInTheDocument();
    expect(screen.getByText('log 24')).toBeInTheDocument();
    expect(screen.queryByText('log 25')).not.toBeInTheDocument();
  });

  it('keeps total scroll height correct via a spacer', () => {
    render(<LogViewer {...PROPS} />);
    expect(screen.getByTestId('log-viewport')).toHaveStyle({ height: '400px' });
    expect(screen.getByTestId('log-spacer')).toHaveStyle({ height: '1000000px' }); // 50000 * 20
  });

  it('renders every row at a stable height and absolute offset', () => {
    render(<LogViewer {...PROPS} />);
    const row = screen.getByText('log 10');
    expect(row).toHaveStyle({ height: '20px', top: '200px' });
  });
});

describe('045 virtualized list — scrolling moves the window', () => {
  it('scrolling to the middle renders visible + overscan rows only', () => {
    render(<LogViewer {...PROPS} />);
    scrollTo(10000); // first visible row = 500

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(30); // 20 visible + 5 above + 5 below
    expect(screen.getByText('log 495')).toBeInTheDocument(); // overscan above
    expect(screen.getByText('log 524')).toBeInTheDocument(); // overscan below
    expect(screen.queryByText('log 494')).not.toBeInTheDocument();
    expect(screen.queryByText('log 525')).not.toBeInTheDocument();
    expect(screen.queryByText('log 0')).not.toBeInTheDocument();
  });

  it('mid-list rows keep index-derived offsets (heights stay stable)', () => {
    render(<LogViewer {...PROPS} />);
    scrollTo(10000);
    expect(screen.getByText('log 500')).toHaveStyle({ top: '10000px', height: '20px' });
  });

  it('clamps the window at the bottom edge', () => {
    render(<LogViewer {...PROPS} />);
    scrollTo(1000000 - 400); // scrolled fully down

    expect(screen.getAllByRole('listitem')).toHaveLength(25); // 5 overscan above, none below
    expect(screen.getByText('log 49999')).toBeInTheDocument();
    expect(screen.getByText('log 49975')).toBeInTheDocument();
    expect(screen.queryByText('log 49974')).not.toBeInTheDocument();
  });

  it('scrolling back up restores the top window', () => {
    render(<LogViewer {...PROPS} />);
    scrollTo(10000);
    scrollTo(0);
    expect(screen.getAllByRole('listitem')).toHaveLength(25);
    expect(screen.getByText('log 0')).toBeInTheDocument();
  });
});

describe('045 virtualized list — render probe', () => {
  it('only rows inside the window are ever rendered', () => {
    const probe = jest.fn();
    render(<LogViewer {...PROPS} onRender={probe} />);
    scrollTo(10000);

    const renderedIndexes = new Set(
      probe.mock.calls.map((call) => Number((call[0] as string).replace('row-', '')))
    );
    // Mount window (0..24) plus mid window (495..524) — nothing else.
    for (const i of renderedIndexes) {
      expect((i >= 0 && i <= 24) || (i >= 495 && i <= 524)).toBe(true);
    }
    expect(renderedIndexes.size).toBeGreaterThan(0);
    expect(renderedIndexes.size).toBeLessThanOrEqual(55);
  });
});
