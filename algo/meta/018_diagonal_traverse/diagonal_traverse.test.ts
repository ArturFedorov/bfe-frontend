import { findDiagonalOrder } from './diagonal_traverse';

/** Reference via grouping by r + c, reversing even diagonals. */
function reference(mat: number[][]): number[] {
  const groups: number[][] = [];
  mat.forEach((row, r) =>
    row.forEach((v, c) => {
      (groups[r + c] ??= []).push(v);
    }),
  );
  return groups.flatMap((g, d) => (d % 2 === 0 ? [...g].reverse() : g));
}

function matrix(m: number, n: number): number[][] {
  return Array.from({ length: m }, (_, r) =>
    Array.from({ length: n }, (_, c) => r * n + c),
  );
}

describe('findDiagonalOrder', () => {
  it('handles a 3x3 matrix', () => {
    expect(
      findDiagonalOrder([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]),
    ).toEqual([1, 2, 4, 7, 5, 3, 6, 8, 9]);
  });

  it('handles a 2x2 matrix', () => {
    expect(
      findDiagonalOrder([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([1, 2, 3, 4]);
  });

  it('handles a single row', () => {
    expect(findDiagonalOrder([[1, 2, 3]])).toEqual([1, 2, 3]);
  });

  it('handles a single column', () => {
    expect(findDiagonalOrder([[1], [2], [3], [4]])).toEqual([1, 2, 3, 4]);
  });

  it('handles a single cell', () => {
    expect(findDiagonalOrder([[42]])).toEqual([42]);
  });

  it('returns an empty array for an empty matrix', () => {
    expect(findDiagonalOrder([])).toEqual([]);
  });

  it('handles a wide matrix (more columns than rows)', () => {
    expect(
      findDiagonalOrder([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
      ]),
    ).toEqual([1, 2, 5, 6, 3, 4, 7, 8]);
  });

  it('handles a tall matrix (more rows than columns)', () => {
    expect(
      findDiagonalOrder([
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
      ]),
    ).toEqual([1, 2, 3, 5, 4, 6, 7, 8]);
  });

  it('handles negatives and duplicates', () => {
    expect(
      findDiagonalOrder([
        [-1, -1, 0],
        [0, -5, 7],
      ]),
    ).toEqual([-1, -1, 0, -5, 0, 7]);
  });

  it('matches the reference on many shapes', () => {
    for (let m = 1; m <= 7; m++) {
      for (let n = 1; n <= 7; n++) {
        const mat = matrix(m, n);
        expect(findDiagonalOrder(mat)).toEqual(reference(mat));
      }
    }
  });

  it('does not mutate the input', () => {
    const mat = matrix(3, 4);
    const copy = mat.map((row) => [...row]);
    findDiagonalOrder(mat);
    expect(mat).toEqual(copy);
  });

  it('handles a large matrix in linear time', () => {
    const mat = matrix(300, 500);
    const out = findDiagonalOrder(mat);
    expect(out).toHaveLength(300 * 500);
    expect(out).toEqual(reference(mat));
  });
});
