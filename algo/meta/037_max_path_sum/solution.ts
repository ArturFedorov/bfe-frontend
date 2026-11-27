import { TreeNode } from '../_shared/structures';

/** Maximum sum over all non-empty paths in the tree. */
export function maxPathSum(root: TreeNode): number {
  let best = -Infinity;

  // Returns the best sum of a path that starts at node and goes down one side.
  const gain = (node: TreeNode | null): number => {
    if (!node) return 0;
    const left = Math.max(0, gain(node.left));
    const right = Math.max(0, gain(node.right));
    best = Math.max(best, node.val + left + right);
    return node.val + Math.max(left, right);
  };

  gain(root);
  return best;
}
