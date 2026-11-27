import { largestIsland } from './making_large_island';

describe('largestIsland', () => {
  it('joins two diagonal islands with one flip', () => {
    expect(
      largestIsland([
        [1, 0],
        [0, 1],
      ]),
    ).toBe(3);
  });

  it('fills the only water cell', () => {
    expect(
      largestIsland([
        [1, 1],
        [1, 0],
      ]),
    ).toBe(4);
  });

  it('returns n*n when there is no water', () => {
    expect(
      largestIsland([
        [1, 1],
        [1, 1],
      ]),
    ).toBe(4);
  });

  it('handles a single water cell', () => {
    expect(largestIsland([[0]])).toBe(1);
  });

  it('handles a single land cell', () => {
    expect(largestIsland([[1]])).toBe(1);
  });

  it('handles an all-water grid', () => {
    expect(
      largestIsland([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]),
    ).toBe(1);
  });

  it('does not double count an island touching the flipped cell twice', () => {
    expect(
      largestIsland([
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1],
      ]),
    ).toBe(9);
  });

  it('does not double count a U-shaped island', () => {
    // The 7-cell U touches the 0 at (1,1) from three sides => 7 + 1.
    expect(
      largestIsland([
        [1, 0, 1],
        [1, 0, 1],
        [1, 1, 1],
      ]),
    ).toBe(8);
  });

  it('joins up to four distinct islands', () => {
    expect(
      largestIsland([
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0],
      ]),
    ).toBe(5);
  });

  it('picks the best of several candidate flips', () => {
    expect(
      largestIsland([
        [1, 1, 0, 0],
        [0, 0, 0, 1],
        [1, 1, 0, 1],
        [1, 1, 0, 1],
      ]),
    ).toBe(8);
  });

  it('does not mutate the input grid', () => {
    const grid = [
      [1, 0],
      [0, 1],
    ];
    largestIsland(grid);
    expect(grid).toEqual([
      [1, 0],
      [0, 1],
    ]);
  });

  it('handles a 500x500 grid quickly (defeats flip-and-recount)', () => {
    // Checkerboard-ish: alternate full land rows and rows that are all water
    // except every 4th column, giving many zeros and one big comb island.
    const n = 500;
    const grid: number[][] = [];
    for (let r = 0; r < n; r++) {
      const row: number[] = [];
      for (let c = 0; c < n; c++) {
        row.push(r % 2 === 0 ? 1 : c % 4 === 0 ? 1 : 0);
      }
      grid.push(row);
    }
    // Total land: 250 full rows * 500 + 250 rows * 125 = 156250, all connected.
    expect(largestIsland(grid)).toBe(156251);
  });
});
