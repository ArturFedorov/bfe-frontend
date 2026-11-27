import { rangeSumBST } from './range_sum_bst';
import { buildTree, TreeNode } from '../_shared/structures';

/** Builds a height-balanced BST from sorted unique values. */
function balancedBST(
  values: number[],
  lo = 0,
  hi = values.length - 1,
): TreeNode | null {
  if (lo > hi) return null;
  const mid = (lo + hi) >> 1;
  return new TreeNode(
    values[mid],
    balancedBST(values, lo, mid - 1),
    balancedBST(values, mid + 1, hi),
  );
}

/** Replaces each node's `val` with a getter that records which nodes were read. */
function instrument(root: TreeNode | null, visited: Set<TreeNode>): void {
  const stack: Array<TreeNode | null> = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    const val = node.val;
    Object.defineProperty(node, 'val', {
      get: () => {
        visited.add(node);
        return val;
      },
    });
    stack.push(node.left, node.right);
  }
}

describe('rangeSumBST', () => {
  it('sums the classic example', () => {
    expect(rangeSumBST(buildTree([10, 5, 15, 3, 7, null, 18]), 7, 15)).toBe(32);
  });

  it('sums the second LeetCode example', () => {
    expect(
      rangeSumBST(buildTree([10, 5, 15, 3, 7, 13, 18, 1, null, 6]), 6, 10),
    ).toBe(23);
  });

  it('returns 0 for an empty tree', () => {
    expect(rangeSumBST(null, 0, 100)).toBe(0);
  });

  it('handles a single node in and out of range', () => {
    expect(rangeSumBST(buildTree([5]), 5, 5)).toBe(5);
    expect(rangeSumBST(buildTree([5]), 6, 10)).toBe(0);
    expect(rangeSumBST(buildTree([5]), 1, 4)).toBe(0);
  });

  it('includes both inclusive boundaries', () => {
    expect(rangeSumBST(buildTree([10, 5, 15, 3, 7, null, 18]), 3, 18)).toBe(58);
  });

  it('returns 0 when the range falls between node values', () => {
    expect(rangeSumBST(buildTree([10, 5, 15, 3, 7, null, 18]), 11, 14)).toBe(0);
  });

  it('returns 0 when the range is entirely outside the tree', () => {
    expect(rangeSumBST(buildTree([10, 5, 15]), 100, 200)).toBe(0);
    expect(rangeSumBST(buildTree([10, 5, 15]), 1, 2)).toBe(0);
  });

  it('handles a range of a single value', () => {
    expect(rangeSumBST(buildTree([10, 5, 15, 3, 7, 13, 18]), 13, 13)).toBe(13);
  });

  it('works on a left-skewed BST', () => {
    expect(
      rangeSumBST(buildTree([5, 4, null, 3, null, 2, null, 1]), 2, 4),
    ).toBe(9);
  });

  it('prunes: reads only O(log n + k) nodes of a balanced BST', () => {
    const values = Array.from({ length: 1023 }, (_, i) => i + 1);
    const root = balancedBST(values);
    const visited = new Set<TreeNode>();
    instrument(root, visited);
    expect(rangeSumBST(root, 500, 505)).toBe(500 + 501 + 502 + 503 + 504 + 505);
    // Path to the range is ~10 nodes deep on each side; 1023 means no pruning.
    expect(visited.size).toBeLessThan(60);
  });

  it('prunes on a 10^5-node right-skewed BST with a range near the root', () => {
    const n = 100_000;
    let root: TreeNode | null = null;
    for (let v = n; v >= 1; v--) root = new TreeNode(v, null, root);
    // 1 -> 2 -> 3 -> ... (right children); only the first few nodes matter.
    expect(rangeSumBST(root, 2, 5)).toBe(2 + 3 + 4 + 5);
  });

  it('sums a full range over a large balanced BST', () => {
    const n = 100_000;
    const values = Array.from({ length: n }, (_, i) => i + 1);
    const root = balancedBST(values);
    expect(rangeSumBST(root, 1, n)).toBe((n * (n + 1)) / 2);
  });
});
