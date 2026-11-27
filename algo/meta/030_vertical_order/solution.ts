import { TreeNode } from '../_shared/structures';

/** Returns node values grouped by column (left to right), each column in BFS order. */
export function verticalOrder(root: TreeNode | null): number[][] {
  if (root === null) return [];

  // BFS visits top-to-bottom, left-to-right: exactly the in-column order needed.
  const columns = new Map<number, number[]>();
  const nodes: TreeNode[] = [root];
  const cols: number[] = [0];
  let minCol = 0;
  let maxCol = 0;

  for (let head = 0; head < nodes.length; head++) {
    const node = nodes[head];
    const col = cols[head];
    const bucket = columns.get(col);
    if (bucket) bucket.push(node.val);
    else columns.set(col, [node.val]);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);

    if (node.left) {
      nodes.push(node.left);
      cols.push(col - 1);
    }
    if (node.right) {
      nodes.push(node.right);
      cols.push(col + 1);
    }
  }

  const result: number[][] = [];
  for (let col = minCol; col <= maxCol; col++) {
    result.push(columns.get(col) as number[]);
  }
  return result;
}
