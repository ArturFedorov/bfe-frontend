import { minCoverageWindow } from './min_coverage_window';

describe('minCoverageWindow', () => {
  it('finds the shortest window covering all required types', () => {
    expect(
      minCoverageWindow(['a', 'b', 'x', 'a', 'c', 'b', 'c', 'a'], ['a', 'b', 'c']),
    ).toEqual([3, 5]);
  });

  it('honors multiplicity when required lists a type twice', () => {
    expect(minCoverageWindow(['a', 'a', 'b', 'a'], ['a', 'a', 'b'])).toEqual([0, 2]);
    expect(minCoverageWindow(['a', 'b', 'a', 'a'], ['a', 'a'])).toEqual([2, 3]);
  });

  it('returns null when a required type never occurs', () => {
    expect(minCoverageWindow(['a', 'b'], ['a', 'z'])).toBeNull();
    expect(minCoverageWindow(['a'], ['a', 'a'])).toBeNull();
  });

  it('returns null for an empty log or empty requirements', () => {
    expect(minCoverageWindow([], ['a'])).toBeNull();
    expect(minCoverageWindow(['a', 'b'], [])).toBeNull();
    expect(minCoverageWindow([], [])).toBeNull();
  });

  it('finds a single-element window', () => {
    expect(minCoverageWindow(['x', 'a', 'x'], ['a'])).toEqual([1, 1]);
  });

  it('returns the whole log when nothing smaller covers', () => {
    expect(minCoverageWindow(['a', 'x', 'x', 'b'], ['a', 'b'])).toEqual([0, 3]);
  });

  it('returns the earliest window on ties', () => {
    expect(minCoverageWindow(['a', 'b', 'a', 'b'], ['a', 'b'])).toEqual([0, 1]);
  });

  it('handles all-identical events', () => {
    expect(minCoverageWindow(['a', 'a', 'a'], ['a'])).toEqual([0, 0]);
    expect(minCoverageWindow(['a', 'a', 'a'], ['a', 'a', 'a'])).toEqual([0, 2]);
  });

  it('is case-sensitive on event types', () => {
    expect(minCoverageWindow(['A', 'b'], ['a', 'b'])).toBeNull();
  });

  it('shrinks aggressively once coverage is reached', () => {
    expect(
      minCoverageWindow(['a', 'x', 'x', 'x', 'b', 'a', 'b'], ['a', 'b']),
    ).toEqual([4, 5]);
  });

  it('handles 100_000 events in time', () => {
    const n = 100_000;
    const events: string[] = new Array(n);
    for (let i = 0; i < n; i++) {
      events[i] = `e${i % 20}`;
    }
    expect(minCoverageWindow(events, ['e0', 'e1', 'e2', 'e3', 'e4'])).toEqual([0, 4]);
  });
});
