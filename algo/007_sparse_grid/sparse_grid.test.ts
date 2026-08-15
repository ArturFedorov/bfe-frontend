import { SparseGrid } from './sparse_grid';

describe('SparseGrid', () => {
  it('starts empty', () => {
    const grid = new SparseGrid<number>();
    expect(grid.size()).toBe(0);
    expect(grid.cells()).toEqual([]);
  });

  it('sets and gets a cell', () => {
    const grid = new SparseGrid<string>();
    grid.set(5, 2, 'total');
    expect(grid.get(5, 2)).toBe('total');
    expect(grid.size()).toBe(1);
  });

  it('returns undefined for an empty cell', () => {
    const grid = new SparseGrid<string>();
    grid.set(1, 1, 'x');
    expect(grid.get(0, 0)).toBeUndefined();
    expect(grid.get(1, 2)).toBeUndefined();
  });

  it('overwrites an existing cell without changing size', () => {
    const grid = new SparseGrid<string>();
    grid.set(3, 4, 'old');
    grid.set(3, 4, 'new');
    expect(grid.get(3, 4)).toBe('new');
    expect(grid.size()).toBe(1);
  });

  it('does not confuse (row, col) with (col, row)', () => {
    const grid = new SparseGrid<string>();
    grid.set(1, 2, 'a');
    expect(grid.get(2, 1)).toBeUndefined();
    grid.set(2, 1, 'b');
    expect(grid.get(1, 2)).toBe('a');
    expect(grid.get(2, 1)).toBe('b');
    expect(grid.size()).toBe(2);
  });

  it('does not collide on ambiguous coordinate concatenations', () => {
    const grid = new SparseGrid<string>();
    grid.set(1, 23, 'a'); // naive '1'+'23' === '12'+'3'
    grid.set(12, 3, 'b');
    expect(grid.get(1, 23)).toBe('a');
    expect(grid.get(12, 3)).toBe('b');
    expect(grid.size()).toBe(2);
  });

  it('stores an empty string as a real cell value', () => {
    const grid = new SparseGrid<string>();
    grid.set(0, 0, '');
    expect(grid.get(0, 0)).toBe('');
    expect(grid.size()).toBe(1);
  });

  describe('delete', () => {
    it('deletes a cell and reports true', () => {
      const grid = new SparseGrid<number>();
      grid.set(2, 2, 42);
      expect(grid.delete(2, 2)).toBe(true);
      expect(grid.get(2, 2)).toBeUndefined();
      expect(grid.size()).toBe(0);
    });

    it('returns false for an already-empty cell', () => {
      const grid = new SparseGrid<number>();
      expect(grid.delete(0, 0)).toBe(false);
      grid.set(0, 0, 1);
      grid.delete(0, 0);
      expect(grid.delete(0, 0)).toBe(false);
    });

    it('allows re-setting a deleted cell', () => {
      const grid = new SparseGrid<number>();
      grid.set(1, 1, 10);
      grid.delete(1, 1);
      grid.set(1, 1, 20);
      expect(grid.get(1, 1)).toBe(20);
      expect(grid.size()).toBe(1);
    });
  });

  describe('cells', () => {
    it('iterates in row-major order (row asc, then col asc)', () => {
      const grid = new SparseGrid<string>();
      grid.set(5, 2, 'c');
      grid.set(0, 9, 'a');
      grid.set(5, 0, 'b');
      expect(grid.cells()).toEqual([
        { row: 0, col: 9, value: 'a' },
        { row: 5, col: 0, value: 'b' },
        { row: 5, col: 2, value: 'c' },
      ]);
    });

    it('orders numerically, not lexicographically', () => {
      const grid = new SparseGrid<string>();
      grid.set(10, 0, 'later');
      grid.set(2, 0, 'earlier');
      grid.set(2, 10, 'after-col-2');
      grid.set(2, 2, 'col-2');
      expect(grid.cells()).toEqual([
        { row: 2, col: 0, value: 'earlier' },
        { row: 2, col: 2, value: 'col-2' },
        { row: 2, col: 10, value: 'after-col-2' },
        { row: 10, col: 0, value: 'later' },
      ]);
    });

    it('returns a fresh array that does not affect the grid when mutated', () => {
      const grid = new SparseGrid<string>();
      grid.set(0, 0, 'x');
      const snapshot = grid.cells();
      snapshot.pop();
      expect(grid.size()).toBe(1);
      expect(grid.cells()).toHaveLength(1);
    });

    it('excludes deleted cells', () => {
      const grid = new SparseGrid<string>();
      grid.set(0, 0, 'keep');
      grid.set(0, 1, 'drop');
      grid.delete(0, 1);
      expect(grid.cells()).toEqual([{ row: 0, col: 0, value: 'keep' }]);
    });
  });

  describe('invalid coordinates', () => {
    it.each([
      ['negative row', -1, 0],
      ['negative col', 0, -1],
      ['non-integer row', 1.5, 0],
      ['non-integer col', 0, 2.5],
      ['NaN row', NaN, 0],
      ['Infinity col', 0, Infinity],
    ])('set/get/delete throw RangeError on %s', (_label, row, col) => {
      const grid = new SparseGrid<number>();
      expect(() => grid.set(row, col, 1)).toThrow(RangeError);
      expect(() => grid.get(row, col)).toThrow(RangeError);
      expect(() => grid.delete(row, col)).toThrow(RangeError);
    });
  });

  it('handles 100k scattered cells with huge coordinates', () => {
    const grid = new SparseGrid<number>();
    const n = 100_000;
    for (let i = 0; i < n; i++) {
      // Deterministic scatter across a 10^9 coordinate space.
      const row = (i * 9_973) % 1_000_000_007 % 10 ** 9;
      const col = (i * 6_151 + 17) % 10 ** 9;
      grid.set(row, col, i);
    }
    expect(grid.size()).toBe(n);
    expect(grid.get(0, 17)).toBe(0); // i = 0
    expect(grid.get(9_973, 6_168)).toBe(1); // i = 1
    expect(grid.get(3, 3)).toBeUndefined();

    const cells = grid.cells();
    expect(cells).toHaveLength(n);
    for (let i = 1; i < cells.length; i++) {
      const prev = cells[i - 1];
      const curr = cells[i];
      const rowMajor = prev.row < curr.row || (prev.row === curr.row && prev.col < curr.col);
      expect(rowMajor).toBe(true);
    }
  });
});
