/** Returns the elements of `mat` in zig-zag diagonal order. */
export function findDiagonalOrder(mat: number[][]): number[] {
  const m = mat.length;
  if (m === 0) return [];
  const n = mat[0].length;
  const out: number[] = [];

  // Diagonal d holds cells with r + c === d; even d goes up-right, odd d goes down-left.
  for (let d = 0; d <= m + n - 2; d++) {
    if (d % 2 === 0) {
      let r = Math.min(d, m - 1);
      let c = d - r;
      while (r >= 0 && c < n) out.push(mat[r--][c++]);
    } else {
      let c = Math.min(d, n - 1);
      let r = d - c;
      while (c >= 0 && r < m) out.push(mat[r++][c--]);
    }
  }
  return out;
}
