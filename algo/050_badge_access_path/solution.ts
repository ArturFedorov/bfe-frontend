export type Cell = '.' | '#' | 'D';

export type Position = [row: number, col: number];

const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export function badgeAccessPath(
  grid: Cell[][],
  start: Position,
  end: Position,
): number {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  if (rows === 0 || cols === 0) return -1;

  const [sr, sc] = start;
  const [er, ec] = end;
  if (sr === er && sc === ec) return 0;

  // State is (row, col, bypassUsed): index = (r * cols + c) * 2 + used.
  const visited = new Uint8Array(rows * cols * 2);
  const encode = (r: number, c: number, used: number): number =>
    (r * cols + c) * 2 + used;

  let frontier: number[] = [encode(sr, sc, 0)];
  visited[frontier[0]] = 1;
  let steps = 0;

  while (frontier.length > 0) {
    steps++;
    const next: number[] = [];

    for (const state of frontier) {
      const used = state & 1;
      const cell = state >> 1;
      const r = Math.floor(cell / cols);
      const c = cell % cols;

      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

        const target = grid[nr][nc];
        if (target === '#') continue;

        const nextUsed = target === 'D' ? used + 1 : used;
        if (nextUsed > 1) continue;
        if (nr === er && nc === ec) return steps;

        const key = encode(nr, nc, nextUsed);
        if (visited[key]) continue;
        visited[key] = 1;
        next.push(key);
      }
    }

    frontier = next;
  }

  return -1;
}
