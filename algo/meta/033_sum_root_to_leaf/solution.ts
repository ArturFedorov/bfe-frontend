import { TreeNode } from '../_shared/structures';

/** Sum of all numbers formed by root-to-leaf digit paths. */
export function sumNumbers(root: TreeNode | null): number {
  // Carry the number built so far down the path; add it at each leaf.
  const dfs = (node: TreeNode | null, current: number): number => {
    if (!node) return 0;
    const next = current * 10 + node.val;
    if (!node.left && !node.right) return next;
    return dfs(node.left, next) + dfs(node.right, next);
  };
  return dfs(root, 0);
}
