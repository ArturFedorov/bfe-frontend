import { shortestPathBinaryMatrix } from './shortest_path_binary_matrix';

describe('shortestPathBinaryMatrix', () => {
  it('example: 2x2 diagonal -> 2', () => {
    expect(
      shortestPathBinaryMatrix([
        [0, 1],
        [1, 0],
      ]),
    ).toBe(2);
  });

  it('example: 3x3 -> 4', () => {
    expect(
      shortestPathBinaryMatrix([
        [0, 0, 0],
        [1, 1, 0],
        [1, 1, 0],
      ]),
    ).toBe(4);
  });

  it('example: blocked start -> -1', () => {
    expect(
      shortestPathBinaryMatrix([
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 0],
      ]),
    ).toBe(-1);
  });

  it('blocked end -> -1', () => {
    expect(
      shortestPathBinaryMatrix([
        [0, 0],
        [0, 1],
      ]),
    ).toBe(-1);
  });

  it('1x1 open -> 1', () => {
    expect(shortestPathBinaryMatrix([[0]])).toBe(1);
  });

  it('1x1 blocked -> -1', () => {
    expect(shortestPathBinaryMatrix([[1]])).toBe(-1);
  });

  it('no path: wall across the grid', () => {
    expect(
      shortestPathBinaryMatrix([
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ]),
    ).toBe(-1);
  });

  it('squeezes through a corner gap diagonally', () => {
    expect(
      shortestPathBinaryMatrix([
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 0],
      ]),
    ).toBe(3);
  });

  it('winding path', () => {
    expect(
      shortestPathBinaryMatrix([
        [0, 1, 0, 0, 0],
        [0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0],
        [0, 0, 0, 1, 0],
      ]),
    ).toBe(13);
  });

  it('open grid: straight diagonal', () => {
    const grid = Array.from({ length: 5 }, () => new Array<number>(5).fill(0));
    expect(shortestPathBinaryMatrix(grid)).toBe(5);
  });

  it('large: 300x300 open grid', () => {
    const n = 300;
    const grid = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    expect(shortestPathBinaryMatrix(grid)).toBe(n);
  });

  it('large: 300x300 serpentine forces a long path', () => {
    const n = 300;
    const grid = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    // walls on every odd row, gap alternating at the right / left end
    for (let r = 1; r < n - 1; r += 2) {
      for (let c = 0; c < n; c++) grid[r][c] = 1;
      const gap = ((r - 1) / 2) % 2 === 0 ? n - 1 : 0;
      grid[r][gap] = 0;
    }
    // 150 open corridors joined by alternating gaps; a DFS would wander, BFS is linear
    expect(shortestPathBinaryMatrix(grid)).toBe(44554);
  });
});
