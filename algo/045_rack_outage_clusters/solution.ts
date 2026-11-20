export type MachineStatus = 'ok' | 'failed';

const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export function countOutageClusters(grid: MachineStatus[][]): number {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    new Array<boolean>(cols).fill(false),
  );
  let clusters = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== 'failed' || visited[r][c]) continue;

      clusters++;
      visited[r][c] = true;
      // Iterative DFS with an explicit stack avoids call-stack overflow.
      const stack: Array<[number, number]> = [[r, c]];

      while (stack.length > 0) {
        const [cr, cc] = stack.pop()!;
        for (const [dr, dc] of DIRECTIONS) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            !visited[nr][nc] &&
            grid[nr][nc] === 'failed'
          ) {
            visited[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
      }
    }
  }

  return clusters;
}
