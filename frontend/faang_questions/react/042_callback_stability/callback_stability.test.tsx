/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel } from './callback_stability';

function countOf(probe: jest.Mock, id: string): number {
  return probe.mock.calls.filter((call) => call[0] === id).length;
}

describe('042 callback stability — behavior (must keep passing)', () => {
  it('filters by search text', async () => {
    const user = userEvent.setup();
    render(<FilterPanel />);
    expect(screen.getAllByRole('listitem')).toHaveLength(8);

    await user.type(screen.getByLabelText('Search'), 'ar');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Arcadia (movies)')).toBeVisible();
  });

  it('filters by category and updates the summary line', async () => {
    const user = userEvent.setup();
    render(<FilterPanel />);
    await user.selectOptions(screen.getByLabelText('Category'), 'series');
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('"" in series: 4 result(s)')).toBeVisible();
  });

  it('search and category combine', async () => {
    const user = userEvent.setup();
    render(<FilterPanel />);
    await user.selectOptions(screen.getByLabelText('Category'), 'movies');
    await user.type(screen.getByLabelText('Search'), 'em');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Ember (movies)')).toBeVisible();
  });
});

describe('042 callback stability — render counts (fail until fixed)', () => {
  it('typing in search never re-renders the category select', async () => {
    const user = userEvent.setup();
    const probe = jest.fn();
    render(<FilterPanel onRender={probe} />);
    probe.mockClear();

    await user.type(screen.getByLabelText('Search'), 'abc');

    expect(countOf(probe, 'panel')).toBe(3);
    expect(countOf(probe, 'search-box')).toBe(3); // its value changed each keystroke
    expect(countOf(probe, 'result-list')).toBe(3); // filtered items changed
    expect(countOf(probe, 'category-select')).toBe(0); // nothing it uses changed
  });

  it('changing category never re-renders the search box', async () => {
    const user = userEvent.setup();
    const probe = jest.fn();
    render(<FilterPanel onRender={probe} />);
    probe.mockClear();

    await user.selectOptions(screen.getByLabelText('Category'), 'series');

    expect(countOf(probe, 'category-select')).toBe(1);
    expect(countOf(probe, 'result-list')).toBe(1);
    expect(countOf(probe, 'search-box')).toBe(0);
  });
});

describe('042 callback stability — over-memoization (fail until removed)', () => {
  it('the marked useMemo around the cheap summary string was removed', () => {
    const source = readFileSync(join(__dirname, 'callback_stability.tsx'), 'utf8');
    // The slow version marks the offending block with this exact tag.
    // Fix = delete the useMemo wrapper AND the marker comment, leaving a
    // plain expression. See README for why that useMemo was a net loss.
    expect(source).not.toContain('OVER-MEMOIZED');
  });
});
