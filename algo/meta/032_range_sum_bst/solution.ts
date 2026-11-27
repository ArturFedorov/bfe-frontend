import { TreeNode } from '../_shared/structures';

/** Returns the sum of BST node values within the inclusive range [low, high]. */
export function rangeSumBST(
  root: TreeNode | null,
  low: number,
  high: number,
): number {
  let sum = 0;
  const stack: TreeNode[] = root ? [root] : [];
  while (stack.length > 0) {
    const node = stack.pop() as TreeNode;
    const { val } = node;
    if (val >= low && val <= high) sum += val;
    // Only descend into subtrees that can still hold in-range values.
    if (val > low && node.left) stack.push(node.left);
    if (val < high && node.right) stack.push(node.right);
  }
  return sum;
}
