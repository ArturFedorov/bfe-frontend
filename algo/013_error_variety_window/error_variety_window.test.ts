import { errorVarietyWindow } from './error_variety_window';

describe('errorVarietyWindow', () => {
  it('finds the longest window with at most k distinct codes', () => {
    expect(errorVarietyWindow(['a', 'a', 'b', 'c', 'c', 'c', 'b'], 2)).toBe(5);
    expect(errorVarietyWindow(['a', 'b', 'a', 'c', 'b', 'b', 'b'], 2)).toBe(4); // c,b,b,b or b,b,b + ...
  });

  it('reduces to the longest same-code run when k = 1', () => {
    expect(errorVarietyWindow(['a', 'b', 'b', 'b', 'a'], 1)).toBe(3);
    expect(errorVarietyWindow(['a', 'b', 'c'], 1)).toBe(1);
  });

  it('returns 0 when k = 0', () => {
    expect(errorVarietyWindow(['a', 'b'], 0)).toBe(0);
    expect(errorVarietyWindow([], 0)).toBe(0);
  });

  it('returns 0 for an empty log', () => {
    expect(errorVarietyWindow([], 3)).toBe(0);
  });

  it('returns the whole log when k covers every distinct code', () => {
    expect(errorVarietyWindow(['a', 'b', 'c'], 3)).toBe(3);
    expect(errorVarietyWindow(['a', 'b', 'a', 'b'], 2)).toBe(4);
    expect(errorVarietyWindow(['a', 'b'], 99)).toBe(2);
  });

  it('returns the full length for all-identical codes with k >= 1', () => {
    expect(errorVarietyWindow(['e', 'e', 'e', 'e'], 1)).toBe(4);
  });

  it('shrinks the window from the left when variety exceeds k', () => {
    // Best is 'b','c','c','c','c' (5); the a-run cannot join without a third code.
    expect(errorVarietyWindow(['a', 'a', 'a', 'b', 'c', 'c', 'c', 'c'], 2)).toBe(5);
  });

  it('is case-sensitive on codes', () => {
    expect(errorVarietyWindow(['A', 'a', 'A', 'a'], 1)).toBe(1);
  });

  it('handles 100_000 log entries in time', () => {
    const n = 100_000;
    const codes: string[] = new Array(n);
    for (let i = 0; i < n; i++) {
      codes[i] = `e${Math.floor(i / 100) % 10}`; // blocks of 100 identical codes
    }
    expect(errorVarietyWindow(codes, 3)).toBe(300);
  });
});
