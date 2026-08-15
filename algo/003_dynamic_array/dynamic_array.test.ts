import { DynamicArray } from './dynamic_array';

describe('DynamicArray', () => {
  it('starts empty with the default capacity of 4', () => {
    const arr = new DynamicArray<number>();
    expect(arr.length).toBe(0);
    expect(arr.capacity).toBe(4);
    expect(arr.resizeCount).toBe(0);
  });

  it('accepts a custom initial capacity', () => {
    const arr = new DynamicArray<number>(10);
    expect(arr.capacity).toBe(10);
    expect(arr.length).toBe(0);
  });

  it('pushes and reads back items in order', () => {
    const arr = new DynamicArray<string>();
    arr.push('a');
    arr.push('b');
    arr.push('c');
    expect(arr.length).toBe(3);
    expect(arr.get(0)).toBe('a');
    expect(arr.get(1)).toBe('b');
    expect(arr.get(2)).toBe('c');
  });

  it('does not resize while under capacity', () => {
    const arr = new DynamicArray<number>();
    arr.push(1);
    arr.push(2);
    arr.push(3);
    arr.push(4);
    expect(arr.length).toBe(4);
    expect(arr.capacity).toBe(4);
    expect(arr.resizeCount).toBe(0);
  });

  it('doubles capacity when a push finds the storage full', () => {
    const arr = new DynamicArray<number>();
    for (let i = 1; i <= 5; i++) {
      arr.push(i);
    }
    expect(arr.length).toBe(5);
    expect(arr.capacity).toBe(8);
    expect(arr.resizeCount).toBe(1);
    expect(arr.toArray()).toEqual([1, 2, 3, 4, 5]);
  });

  it('doubles repeatedly from a capacity of 1', () => {
    const arr = new DynamicArray<number>(1);
    arr.push(10); // fits, capacity 1
    arr.push(20); // 1 -> 2
    arr.push(30); // 2 -> 4
    arr.push(40); // fits
    expect(arr.capacity).toBe(4);
    expect(arr.resizeCount).toBe(2);
    expect(arr.toArray()).toEqual([10, 20, 30, 40]);
  });

  it('stores duplicate values', () => {
    const arr = new DynamicArray<number>();
    arr.push(5);
    arr.push(5);
    expect(arr.toArray()).toEqual([5, 5]);
  });

  describe('toArray', () => {
    it('returns an empty array for an empty DynamicArray', () => {
      const arr = new DynamicArray<number>();
      expect(arr.toArray()).toEqual([]);
    });

    it('returns a copy that does not expose internal storage', () => {
      const arr = new DynamicArray<number>();
      arr.push(1);
      arr.push(2);
      const snapshot = arr.toArray();
      snapshot.push(999);
      snapshot[0] = -1;
      expect(arr.length).toBe(2);
      expect(arr.get(0)).toBe(1);
      expect(arr.toArray()).toEqual([1, 2]);
    });

    it('never leaks unused capacity slots', () => {
      const arr = new DynamicArray<number>(8);
      arr.push(1);
      expect(arr.toArray()).toEqual([1]);
      expect(arr.toArray()).toHaveLength(1);
    });
  });

  describe('invalid initial capacity', () => {
    it.each([
      ['zero', 0],
      ['negative', -3],
      ['non-integer', 2.5],
      ['NaN', NaN],
      ['Infinity', Infinity],
    ])('throws RangeError on %s', (_label, capacity) => {
      expect(() => new DynamicArray<number>(capacity)).toThrow(RangeError);
    });
  });

  describe('out-of-range get', () => {
    it.each([
      ['negative index', -1],
      ['index equal to length', 2],
      ['index far beyond length', 100],
    ])('throws RangeError on %s', (_label, index) => {
      const arr = new DynamicArray<number>();
      arr.push(1);
      arr.push(2);
      expect(() => arr.get(index)).toThrow(RangeError);
    });

    it('throws RangeError when reading from an empty array even within capacity', () => {
      const arr = new DynamicArray<number>(4);
      expect(() => arr.get(0)).toThrow(RangeError);
    });
  });

  it('handles 100k pushes with amortized-constant cost', () => {
    const n = 100_000;
    const arr = new DynamicArray<number>();
    for (let i = 0; i < n; i++) {
      arr.push(i);
    }
    expect(arr.length).toBe(n);
    // 4 -> 131072 is 15 doublings (65536 < 100000 <= 131072).
    expect(arr.capacity).toBe(131_072);
    expect(arr.resizeCount).toBe(15);
    expect(arr.get(0)).toBe(0);
    expect(arr.get(n - 1)).toBe(n - 1);
  });
});
