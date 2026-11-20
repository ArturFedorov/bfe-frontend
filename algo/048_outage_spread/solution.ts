export interface OutageInput {
  /** server id, or null for an empty slot that blocks the cascade */
  grid: (string | null)[][];
  /** ids of servers already failed at minute 0 */
  initialFailures: string[];
}

export interface OutageResult {
  /** minute of the last new infection; 0 if nothing new is infected */
  minutes: number;
  /** ids of servers never affected, sorted alphabetically */
  unaffected: string[];
}

const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export function outageSpread({
  grid,
  initialFailures,
}: OutageInput): OutageResult {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const failedIds = new Set(initialFailures);
  const failed: boolean[][] = Array.from({ length: rows }, () =>
    new Array<boolean>(cols).fill(false),
  );

  // All initial failures form one frontier (multi-source BFS).
  let frontier: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = grid[r][c];
      if (id !== null && failedIds.has(id)) {
        failed[r][c] = true;
        frontier.push([r, c]);
      }
    }
  }

  let minutes = 0;
  while (frontier.length > 0) {
    const next: Array<[number, number]> = [];

    for (const [r, c] of frontier) {
      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 &&
          nr < rows &&
          nc >= 0 &&
          nc < cols &&
          grid[nr][nc] !== null &&
          !failed[nr][nc]
        ) {
          failed[nr][nc] = true;
          next.push([nr, nc]);
        }
      }
    }

    if (next.length > 0) minutes++;
    frontier = next;
  }

  const unaffected: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = grid[r][c];
      if (id !== null && !failed[r][c]) unaffected.push(id);
    }
  }

  return { minutes, unaffected: unaffected.sort() };
}
