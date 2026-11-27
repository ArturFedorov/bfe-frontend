/** Returns the largest island size achievable after flipping at most one 0 to 1. */
export function largestIsland(grid: number[][]): number {
  const n = grid.length;
  // Label each island with an id (>= 2) and remember its area; then each 0
  // joins the distinct neighbouring islands.
  const ids = new Int32Array(n * n);
  const area: number[] = [0, 0];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  let best = 0;
  let nextId = 2;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== 1 || ids[r * n + c] !== 0) continue;
      const id = nextId++;
      let size = 0;
      const stack = [r * n + c];
      ids[r * n + c] = id;
      while (stack.length > 0) {
        const cell = stack.pop() as number;
        size++;
        const cr = Math.floor(cell / n);
        const cc = cell % n;
        for (const [dr, dc] of dirs) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
          const key = nr * n + nc;
          if (grid[nr][nc] === 1 && ids[key] === 0) {
            ids[key] = id;
            stack.push(key);
          }
        }
      }
      area[id] = size;
      best = Math.max(best, size);
    }
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== 0) continue;
      const seen = new Set<number>();
      let total = 1;
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
        const id = ids[nr * n + nc];
        if (id !== 0 && !seen.has(id)) {
          seen.add(id);
          total += area[id];
        }
      }
      best = Math.max(best, total);
    }
  }

  return best;
}
