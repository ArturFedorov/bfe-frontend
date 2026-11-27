import { RandomizedSet } from './randomized_set';

describe('RandomizedSet', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Makes Math.random return 0, 1/n, 2/n, ... (n - 1)/n, cyclically. */
  function mockEvenlySpacedRandom(n: number): void {
    let i = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      const r = (i % n) / n;
      i++;
      return r;
    });
  }

  it('runs the README example', () => {
    const set = new RandomizedSet();
    expect(set.insert(1)).toBe(true);
    expect(set.remove(2)).toBe(false);
    expect(set.insert(2)).toBe(true);
    expect([1, 2]).toContain(set.getRandom());
    expect(set.remove(1)).toBe(true);
    expect(set.insert(2)).toBe(false);
    expect(set.getRandom()).toBe(2);
  });

  it('rejects duplicate inserts', () => {
    const set = new RandomizedSet();
    expect(set.insert(5)).toBe(true);
    expect(set.insert(5)).toBe(false);
    expect(set.insert(5)).toBe(false);
  });

  it('returns false when removing from an empty set', () => {
    const set = new RandomizedSet();
    expect(set.remove(0)).toBe(false);
  });

  it('returns false on a second remove of the same value', () => {
    const set = new RandomizedSet();
    set.insert(3);
    expect(set.remove(3)).toBe(true);
    expect(set.remove(3)).toBe(false);
  });

  it('allows re-inserting a removed value', () => {
    const set = new RandomizedSet();
    set.insert(7);
    set.remove(7);
    expect(set.insert(7)).toBe(true);
    expect(set.getRandom()).toBe(7);
  });

  it('handles negatives, zero and 32-bit boundaries', () => {
    const set = new RandomizedSet();
    const vals = [-(2 ** 31), -1, 0, 2 ** 31 - 1];
    for (const v of vals) expect(set.insert(v)).toBe(true);
    mockEvenlySpacedRandom(vals.length);
    const seen = new Set<number>();
    for (let i = 0; i < vals.length; i++) seen.add(set.getRandom());
    expect([...seen].sort((a, b) => a - b)).toEqual(vals);
  });

  it('getRandom can reach every element (uniform index pick)', () => {
    const set = new RandomizedSet();
    for (let v = 10; v < 20; v++) set.insert(v);
    mockEvenlySpacedRandom(10);
    const seen = new Set<number>();
    for (let i = 0; i < 10; i++) seen.add(set.getRandom());
    expect(seen.size).toBe(10);
  });

  it('getRandom never returns a removed element', () => {
    const set = new RandomizedSet();
    for (let v = 0; v < 10; v++) set.insert(v);
    for (let v = 0; v < 10; v += 2) set.remove(v);
    mockEvenlySpacedRandom(5);
    const seen = new Set<number>();
    for (let i = 0; i < 5; i++) seen.add(set.getRandom());
    expect([...seen].sort((a, b) => a - b)).toEqual([1, 3, 5, 7, 9]);
  });

  it('stays consistent after removing the last-inserted element', () => {
    const set = new RandomizedSet();
    set.insert(1);
    set.insert(2);
    expect(set.remove(2)).toBe(true);
    expect(set.getRandom()).toBe(1);
    expect(set.insert(2)).toBe(true);
    expect(set.remove(1)).toBe(true);
    expect(set.getRandom()).toBe(2);
  });

  it('handles a mixed sequence of operations', () => {
    const set = new RandomizedSet();
    const model = new Set<number>();
    let seed = 42;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed;
    };
    for (let i = 0; i < 2000; i++) {
      const v = next() % 50;
      if (next() % 2 === 0) {
        expect(set.insert(v)).toBe(!model.has(v));
        model.add(v);
      } else {
        expect(set.remove(v)).toBe(model.has(v));
        model.delete(v);
      }
      if (model.size > 0) expect(model.has(set.getRandom())).toBe(true);
    }
  });

  it('runs 2·10^5 inserts, getRandoms and removes in O(1) each', () => {
    const n = 200_000;
    const set = new RandomizedSet();
    const start = performance.now();
    for (let i = 0; i < n; i++) set.insert(i);
    for (let i = 0; i < n; i++) set.getRandom();
    // Remove in reverse order: indexOf-based removal scans the whole array each time.
    let removed = 0;
    for (let i = n - 1; i >= 0; i--) if (set.remove(i)) removed++;
    expect(removed).toBe(n);
    expect(set.insert(0)).toBe(true);
    expect(set.getRandom()).toBe(0);
    expect(performance.now() - start).toBeLessThan(500);
  });
});
