/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RenderCounterLab } from './render_counter_lab';

function countOf(probe: jest.Mock, id: string): number {
  return probe.mock.calls.filter((call) => call[0] === id).length;
}

describe('040 render counter lab', () => {
  it('renders every component exactly once on mount', () => {
    const probe = jest.fn();
    render(<RenderCounterLab onRender={probe} />);
    for (const id of ['app', 'title', 'memo-title', 'panel', 'stable', 'leaf']) {
      expect(countOf(probe, id)).toBe(1);
    }
  });

  it('app state change re-renders everything except the memoized child', async () => {
    const user = userEvent.setup();
    const probe = jest.fn();
    render(<RenderCounterLab onRender={probe} />);
    probe.mockClear();

    await user.click(screen.getByRole('button', { name: /increment app/i }));

    expect(screen.getByRole('button', { name: /increment app \(1\)/i })).toBeVisible();
    expect(countOf(probe, 'app')).toBe(1);
    expect(countOf(probe, 'title')).toBe(1);
    // memo + identical props (onRender is the same jest.fn every render)
    expect(countOf(probe, 'memo-title')).toBe(0);
    expect(countOf(probe, 'panel')).toBe(1);
    // children element is RECREATED by App's render, so memo would not even help here
    expect(countOf(probe, 'stable')).toBe(1);
    expect(countOf(probe, 'leaf')).toBe(1);
  });

  it('panel state change re-renders panel + leaf but NOT the children passed from above', async () => {
    const user = userEvent.setup();
    const probe = jest.fn();
    render(<RenderCounterLab onRender={probe} />);
    probe.mockClear();

    await user.click(screen.getByRole('button', { name: /toggle panel/i }));

    expect(screen.getByText('Panel is open')).toBeVisible();
    expect(countOf(probe, 'app')).toBe(0);
    expect(countOf(probe, 'title')).toBe(0);
    expect(countOf(probe, 'memo-title')).toBe(0);
    expect(countOf(probe, 'panel')).toBe(1);
    // <Stable /> was created in App's render; Panel re-rendering reuses the
    // exact same element object, so React bails out without memo.
    expect(countOf(probe, 'stable')).toBe(0);
    // Leaf is created inside Panel's render, so it re-renders with Panel.
    expect(countOf(probe, 'leaf')).toBe(1);
  });
});
