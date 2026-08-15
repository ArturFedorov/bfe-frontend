import { longestUniqueRun } from './longest_unique_run';

describe('longestUniqueRun', () => {
  it('finds the longest duplicate-free run', () => {
    expect(longestUniqueRun(['a', 'b', 'c', 'a', 'b'])).toBe(3);
    expect(longestUniqueRun(['a', 'b', 'b', 'c', 'd'])).toBe(3);
    expect(longestUniqueRun(['p', 'w', 'w', 'k', 'e', 'w'])).toBe(3);
  });

  it('returns 0 for an empty log', () => {
    expect(longestUniqueRun([])).toBe(0);
  });

  it('returns 1 for a single request', () => {
    expect(longestUniqueRun(['solo'])).toBe(1);
  });

  it('returns 1 when every id is identical', () => {
    expect(longestUniqueRun(['x', 'x', 'x', 'x'])).toBe(1);
  });

  it('returns the full length when every id is unique', () => {
    expect(longestUniqueRun(['a', 'b', 'c', 'd', 'e'])).toBe(5);
  });

  it('handles a duplicate far back in the window', () => {
    // The repeat of 'a' only trims the window back to just past the first 'a'.
    expect(longestUniqueRun(['a', 'b', 'c', 'd', 'a', 'e', 'f'])).toBe(6);
  });

  it('is case-sensitive on ids', () => {
    expect(longestUniqueRun(['A', 'a', 'A'])).toBe(2);
  });

  it('handles adjacent duplicates surrounded by unique runs', () => {
    expect(longestUniqueRun(['a', 'b', 'c', 'c', 'd', 'e', 'f', 'g'])).toBe(6);
  });

  it('handles 100_000 requests in time', () => {
    const n = 100_000;
    const ids: string[] = new Array(n);
    for (let i = 0; i < n; i++) {
      ids[i] = `c${i % 1000}`;
    }
    expect(longestUniqueRun(ids)).toBe(1000);
  });
});
