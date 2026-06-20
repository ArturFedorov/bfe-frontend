/**
 * LC 130. Surrounded Regions
 *
 * Capture all regions that are 4-directionally surrounded by 'X' by flipping
 * their 'O's to 'X'. An 'O' connected to a border 'O' is never captured.
 *
 * Modifies `board` in place.
 */
export function solve(board: string[][]): void {
  const m = board.length;
  const n = board[0].length;

  const vis = Array.from({ length: m }, () => Array(n).fill(false));

  const dfs = (i: number, j: number) => {
    if (
      i < 0 ||
      i >= m ||
      j < 0 ||
      j >= n ||
      vis[i][j] ||
      board[i][j] === 'X'
    ) {
      return;
    }

    vis[i][j] = true;
    dfs(i + 1, j);
    dfs(i - 1, j);
    dfs(i, j + 1);
    dfs(i, j - 1);
  };

  for (let i = 0; i < m; i++) {
    if (board[i][0] === 'O' && !vis[i][0]) dfs(i, 0);
    if (board[i][n - 1] === 'O' && !vis[i][n - 1]) dfs(i, n - 1);
  }

  for (let j = 0; j < n; j++) {
    if (board[0][j] === 'O' && !vis[0][j]) dfs(0, j);
    if (board[m - 1][j] === 'O' && !vis[m - 1][j]) dfs(m - 1, j);
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (board[i][j] === 'O' && !vis[i][j]) {
        board[i][j] = 'X';
      }
    }
  }
}
