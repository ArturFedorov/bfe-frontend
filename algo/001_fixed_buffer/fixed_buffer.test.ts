import { FixedBuffer } from './fixed_buffer';

describe('FixedBuffer', () => {
  it('starts empty', () => {
    const buf = new FixedBuffer<number>(3);
    expect(buf.size()).toBe(0);
  });

  it('pushes items and reads them back by index', () => {
    const buf = new FixedBuffer<number>(3);
    buf.push(10);
    buf.push(20);
    expect(buf.size()).toBe(2);
    expect(buf.get(0)).toBe(10);
    expect(buf.get(1)).toBe(20);
  });

  it('fills exactly to capacity', () => {
    const buf = new FixedBuffer<string>(2);
    buf.push('a');
    buf.push('b');
    expect(buf.size()).toBe(2);
    expect(buf.get(0)).toBe('a');
    expect(buf.get(1)).toBe('b');
  });

  it('stores duplicate values independently', () => {
    const buf = new FixedBuffer<number>(3);
    buf.push(7);
    buf.push(7);
    expect(buf.size()).toBe(2);
    expect(buf.get(0)).toBe(7);
    expect(buf.get(1)).toBe(7);
  });

  it('stores object items by reference', () => {
    const buf = new FixedBuffer<{ cpu: number }>(2);
    const sample = { cpu: 0.5 };
    buf.push(sample);
    expect(buf.get(0)).toBe(sample);
  });

  it('works with capacity 1', () => {
    const buf = new FixedBuffer<number>(1);
    buf.push(42);
    expect(buf.size()).toBe(1);
    expect(buf.get(0)).toBe(42);
    expect(() => buf.push(43)).toThrow(Error);
  });

  describe('push when full', () => {
    it('throws Error once capacity is reached', () => {
      const buf = new FixedBuffer<number>(2);
      buf.push(1);
      buf.push(2);
      expect(() => buf.push(3)).toThrow(Error);
    });

    it('does not corrupt existing contents after a failed push', () => {
      const buf = new FixedBuffer<number>(2);
      buf.push(1);
      buf.push(2);
      expect(() => buf.push(3)).toThrow();
      expect(buf.size()).toBe(2);
      expect(buf.get(0)).toBe(1);
      expect(buf.get(1)).toBe(2);
    });
  });

  describe('invalid capacity', () => {
    it.each([
      ['zero', 0],
      ['negative', -1],
      ['non-integer', 1.5],
      ['NaN', NaN],
      ['Infinity', Infinity],
    ])('throws RangeError on %s capacity', (_label, capacity) => {
      expect(() => new FixedBuffer<number>(capacity)).toThrow(RangeError);
    });
  });

  describe('out-of-range get', () => {
    it.each([
      ['negative index', -1],
      ['index equal to size', 2],
      ['index beyond size', 5],
    ])('throws RangeError on %s', (_label, index) => {
      const buf = new FixedBuffer<number>(4);
      buf.push(1);
      buf.push(2);
      expect(() => buf.get(index)).toThrow(RangeError);
    });

    it('throws RangeError on any get from an empty buffer', () => {
      const buf = new FixedBuffer<number>(4);
      expect(() => buf.get(0)).toThrow(RangeError);
    });
  });

  it('handles a large buffer efficiently', () => {
    const n = 100_000;
    const buf = new FixedBuffer<number>(n);
    for (let i = 0; i < n; i++) {
      buf.push(i * 2);
    }
    expect(buf.size()).toBe(n);
    expect(buf.get(0)).toBe(0);
    expect(buf.get(n - 1)).toBe((n - 1) * 2);
    expect(buf.get(n / 2)).toBe(n);
    expect(() => buf.push(-1)).toThrow(Error);
  });
});
