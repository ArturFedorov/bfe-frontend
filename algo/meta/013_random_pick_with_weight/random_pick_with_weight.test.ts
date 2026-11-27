import { WeightedPicker } from './random_pick_with_weight';

const mockRandom = (...values: number[]): jest.SpyInstance => {
  const spy = jest.spyOn(Math, 'random');
  for (const v of values) spy.mockReturnValueOnce(v);
  return spy;
};

describe('WeightedPicker', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('single weight always returns 0', () => {
    const picker = new WeightedPicker([5]);
    mockRandom(0, 0.5, 0.999999);
    expect([
      picker.pickIndex(),
      picker.pickIndex(),
      picker.pickIndex(),
    ]).toEqual([0, 0, 0]);
  });

  it('README example: [1, 3]', () => {
    const picker = new WeightedPicker([1, 3]);
    mockRandom(0.1, 0.25, 0.9);
    expect(picker.pickIndex()).toBe(0);
    expect(picker.pickIndex()).toBe(1);
    expect(picker.pickIndex()).toBe(1);
  });

  it('r = 0 picks the first index', () => {
    const picker = new WeightedPicker([2, 2, 2]);
    mockRandom(0);
    expect(picker.pickIndex()).toBe(0);
  });

  it('r just below 1 picks the last index', () => {
    const picker = new WeightedPicker([2, 2, 2]);
    mockRandom(0.9999999);
    expect(picker.pickIndex()).toBe(2);
  });

  it('boundaries belong to the next index', () => {
    // prefix [1, 2, 4, 8], total 8 (power of two keeps r * total exact)
    const picker = new WeightedPicker([1, 1, 2, 4]);
    mockRandom(0.125, 0.25, 0.5, 0.1249, 0.2499, 0.4999);
    expect(picker.pickIndex()).toBe(1);
    expect(picker.pickIndex()).toBe(2);
    expect(picker.pickIndex()).toBe(3);
    expect(picker.pickIndex()).toBe(0);
    expect(picker.pickIndex()).toBe(1);
    expect(picker.pickIndex()).toBe(2);
  });

  it('uses exactly one Math.random call per pick', () => {
    const picker = new WeightedPicker([3, 1, 4, 1, 5]);
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    picker.pickIndex();
    picker.pickIndex();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('heavy weight dominates the range', () => {
    // prefix [1, 100, 101], total 101
    const picker = new WeightedPicker([1, 99, 1]);
    mockRandom(0.005, 0.01, 0.5, 0.98, 0.995);
    expect([1, 2, 3, 4, 5].map(() => picker.pickIndex())).toEqual([
      0, 1, 1, 1, 2,
    ]);
  });

  it('sweep of evenly spaced randoms matches weight proportions', () => {
    const w = [1, 3, 2, 2];
    const picker = new WeightedPicker(w);
    const counts = [0, 0, 0, 0];
    const steps = 1024;
    const spy = jest.spyOn(Math, 'random');
    for (let s = 0; s < steps; s++) {
      spy.mockReturnValueOnce(s / steps);
      counts[picker.pickIndex()]++;
    }
    expect(counts).toEqual([128, 384, 256, 256]);
  });

  it('separate instances do not share state', () => {
    const a = new WeightedPicker([1, 1]);
    const b = new WeightedPicker([9, 1]);
    mockRandom(0.6, 0.6);
    expect(a.pickIndex()).toBe(1);
    expect(b.pickIndex()).toBe(0);
  });

  it('~10^5 weights and ~10^5 picks run in O(log n) per pick', () => {
    const n = 1 << 17; // 131072; a power of two keeps r * total exact
    const w = new Array<number>(n).fill(1);
    const picker = new WeightedPicker(w);
    let k = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      const r = ((k * 7919) % n) / n;
      k++;
      return r;
    });
    for (let i = 0; i < n; i++) {
      const expected = (i * 7919) % n;
      const got = picker.pickIndex();
      if (got !== expected) {
        expect(got).toBe(expected);
      }
    }
    expect(k).toBe(n);
  });
});
