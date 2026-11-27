import { verticalOrder } from './vertical_order';
import { buildTree, TreeNode } from '../_shared/structures';

describe('verticalOrder', () => {
  it('groups the classic example by column', () => {
    expect(verticalOrder(buildTree([3, 9, 20, null, null, 15, 7]))).toEqual([
      [9],
      [3, 15],
      [20],
      [7],
    ]);
  });

  it('orders same-row, same-column nodes left to right', () => {
    expect(verticalOrder(buildTree([3, 9, 8, 4, 0, 1, 7]))).toEqual([
      [4],
      [9],
      [3, 0, 1],
      [8],
      [7],
    ]);
  });

  it('does not sort same-row ties by value (BFS order, not LC 987)', () => {
    // 5 (left.right) and 2 (right.left) share column 0 and depth 2.
    expect(verticalOrder(buildTree([3, 9, 8, 4, 5, 2, 7]))).toEqual([
      [4],
      [9],
      [3, 5, 2],
      [8],
      [7],
    ]);
  });

  it('puts shallower nodes first even if they are in the right subtree', () => {
    // Column 1 holds 3 (depth 1, right subtree) and 5 (depth 3, left subtree).
    expect(
      verticalOrder(buildTree([1, 2, 3, null, 4, null, null, null, 5])),
    ).toEqual([[2], [1, 4], [3, 5]]);
  });

  it('matches the LeetCode example with deeper nodes', () => {
    expect(
      verticalOrder(buildTree([3, 9, 8, 4, 0, 1, 7, null, null, null, 2, 5])),
    ).toEqual([[4], [9, 5], [3, 0, 1], [8, 2], [7]]);
  });

  it('returns [] for an empty tree', () => {
    expect(verticalOrder(null)).toEqual([]);
  });

  it('handles a single node', () => {
    expect(verticalOrder(buildTree([42]))).toEqual([[42]]);
  });

  it('keeps duplicate and negative values', () => {
    expect(verticalOrder(buildTree([0, -1, -1, -1, -1, -1, -1]))).toEqual([
      [-1],
      [-1],
      [0, -1, -1],
      [-1],
      [-1],
    ]);
  });

  it('handles a zig-zag tree that returns to column 0', () => {
    // 1 -> left 2 -> right 3 -> left 4 -> right 5
    expect(
      verticalOrder(buildTree([1, 2, null, null, 3, 4, null, null, 5])),
    ).toEqual([
      [2, 4],
      [1, 3, 5],
    ]);
  });

  it('handles a right-skewed tree', () => {
    expect(verticalOrder(buildTree([1, null, 2, null, 3]))).toEqual([
      [1],
      [2],
      [3],
    ]);
  });

  it('handles a 10^5-deep left-skewed tree without recursion', () => {
    const n = 100_000;
    // Build directly: a level-order array for a skewed tree is fine too, but this is faster.
    let root: TreeNode | null = null;
    for (let v = n - 1; v >= 0; v--) root = new TreeNode(v, root);
    const result = verticalOrder(root);
    expect(result).toHaveLength(n);
    expect(result[0]).toEqual([n - 1]);
    expect(result[n - 1]).toEqual([0]);
    expect(
      result.every((col, i) => col.length === 1 && col[0] === n - 1 - i),
    ).toBe(true);
  });
});
