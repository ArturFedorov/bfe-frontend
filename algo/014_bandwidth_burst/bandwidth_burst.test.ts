import { bandwidthBurst } from './bandwidth_burst';

describe('bandwidthBurst', () => {
  it('finds the shortest run reaching the cap', () => {
    expect(bandwidthBurst([2, 3, 1, 2, 4, 3], 7)).toBe(2); // [4, 3]
    expect(bandwidthBurst([1, 2, 3, 4, 5], 11)).toBe(3); // [3, 4, 5]
  });

  it('returns 1 when a single transfer meets the cap', () => {
    expect(bandwidthBurst([1, 4, 4], 4)).toBe(1);
    expect(bandwidthBurst([10], 10)).toBe(1);
    expect(bandwidthBurst([1, 100, 1], 50)).toBe(1);
  });

  it('returns 0 when the cap is never reached', () => {
    expect(bandwidthBurst([1, 1, 1], 100)).toBe(0);
    expect(bandwidthBurst([5], 6)).toBe(0);
  });

  it('returns 0 for an empty transfer list', () => {
    expect(bandwidthBurst([], 1)).toBe(0);
  });

  it('needs the whole array when only the total reaches the cap', () => {
    expect(bandwidthBurst([1, 2, 3], 6)).toBe(3);
  });

  it('handles all-identical transfers', () => {
    expect(bandwidthBurst([5, 5, 5, 5], 15)).toBe(3);
    expect(bandwidthBurst([5, 5, 5, 5], 16)).toBe(4);
    expect(bandwidthBurst([5, 5, 5, 5], 21)).toBe(0);
  });

  it('handles a run of exactly the cap sum', () => {
    expect(bandwidthBurst([3, 4, 3], 7)).toBe(2); // [3, 4] hits 7 exactly
  });

  it('shrinks past earlier elements when a later dense run appears', () => {
    expect(bandwidthBurst([1, 1, 1, 1, 6, 6], 12)).toBe(2); // [6, 6]
  });

  it('handles 100_000 transfers in time', () => {
    const n = 100_000;
    const transfers: number[] = new Array(n).fill(1);
    expect(bandwidthBurst(transfers, 50_000)).toBe(50_000);
  });
});
