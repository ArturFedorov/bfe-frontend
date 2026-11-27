/** Length of the shortest 8-directional clear path from top-left to bottom-right, or -1. */
export function shortestPathBinaryMatrix(grid: number[][]): number {
  const n = grid.length;
  if (n === 0 || grid[0][0] !== 0 || grid[n - 1][n - 1] !== 0) return -1;

  // BFS by layers; dist[] doubles as the visited set.
  const dist = new Int32Array(n * n);
  const queue = new Int32Array(n * n);
  let head = 0;
  let tail = 0;
  queue[tail++] = 0;
  dist[0] = 1;

  while (head < tail) {
    const cell = queue[head++];
    const r = Math.floor(cell / n);
    const c = cell % n;
    if (r === n - 1 && c === n - 1) return dist[cell];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
        const next = nr * n + nc;
        if (grid[nr][nc] !== 0 || dist[next] !== 0) continue;
        dist[next] = dist[cell] + 1;
        queue[tail++] = next;
      }
    }
  }
  return -1;
}
