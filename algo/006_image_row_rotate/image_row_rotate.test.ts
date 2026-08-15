import { rotateRow } from './image_row_rotate';

describe('rotateRow', () => {
  it('rotates left by k', () => {
    const row = [1, 2, 3, 4, 5];
    rotateRow(row, 2, 'left');
    expect(row).toEqual([3, 4, 5, 1, 2]);
  });

  it('rotates right by k', () => {
    const row = [1, 2, 3, 4, 5];
    rotateRow(row, 2, 'right');
    expect(row).toEqual([4, 5, 1, 2, 3]);
  });

  it('rotates by one in each direction', () => {
    const left = [1, 2, 3];
    rotateRow(left, 1, 'left');
    expect(left).toEqual([2, 3, 1]);

    const right = [1, 2, 3];
    rotateRow(right, 1, 'right');
    expect(right).toEqual([3, 1, 2]);
  });

  it('mutates the array in place and returns undefined', () => {
    const row = [1, 2, 3];
    const result = rotateRow(row, 1, 'left');
    expect(result).toBeUndefined();
    expect(row).toEqual([2, 3, 1]);
  });

  it('leaves the row unchanged when k is 0', () => {
    const row = [1, 2, 3, 4];
    rotateRow(row, 0, 'left');
    expect(row).toEqual([1, 2, 3, 4]);
  });

  it('leaves the row unchanged when k equals the length', () => {
    const row = [1, 2, 3, 4];
    rotateRow(row, 4, 'right');
    expect(row).toEqual([1, 2, 3, 4]);
  });

  it('wraps k larger than the length', () => {
    const row = [1, 2, 3];
    rotateRow(row, 5, 'left'); // 5 % 3 === 2
    expect(row).toEqual([3, 1, 2]);
  });

  it('handles a huge k on a small row without stepping one at a time', () => {
    const row = [1, 2, 3, 4];
    rotateRow(row, 10 ** 9 + 1, 'right'); // (10^9 + 1) % 4 === 1
    expect(row).toEqual([4, 1, 2, 3]);
  });

  it('handles an empty row', () => {
    const row: number[] = [];
    rotateRow(row, 3, 'left');
    expect(row).toEqual([]);
  });

  it('handles a single-pixel row', () => {
    const row = [42];
    rotateRow(row, 7, 'right');
    expect(row).toEqual([42]);
  });

  it('preserves duplicate pixel values', () => {
    const row = [5, 5, 1, 5];
    rotateRow(row, 1, 'left');
    expect(row).toEqual([5, 1, 5, 5]);
  });

  it('left and right rotations are inverses', () => {
    const row = [9, 8, 7, 6, 5, 4];
    rotateRow(row, 4, 'left');
    rotateRow(row, 4, 'right');
    expect(row).toEqual([9, 8, 7, 6, 5, 4]);
  });

  describe('invalid k', () => {
    it.each([
      ['negative', -1],
      ['non-integer', 1.5],
      ['NaN', NaN],
      ['Infinity', Infinity],
    ])('throws RangeError on %s k without mutating', (_label, k) => {
      const row = [1, 2, 3];
      expect(() => rotateRow(row, k, 'left')).toThrow(RangeError);
      expect(row).toEqual([1, 2, 3]);
    });
  });

  it('rotates a 100k row by k = n - 1 quickly', () => {
    const n = 100_000;
    const row: number[] = [];
    for (let i = 0; i < n; i++) {
      row.push(i);
    }
    rotateRow(row, n - 1, 'left'); // one step right, effectively
    const expected = [n - 1];
    for (let i = 0; i < n - 1; i++) {
      expected.push(i);
    }
    expect(row).toEqual(expected);
  });
});
