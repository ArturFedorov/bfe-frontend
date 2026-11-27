import { TreeNode } from '../_shared/structures';

/** Value in the BST closest to target; ties resolve to the smaller value. */
export function closestValue(root: TreeNode | null, target: number): number {
  if (!root) throw new Error('Empty tree');
  // The closest value always lies on the BST search path for target.
  let best = root.val;
  let node: TreeNode | null = root;
  while (node) {
    const diff = Math.abs(node.val - target);
    const bestDiff = Math.abs(best - target);
    if (diff < bestDiff || (diff === bestDiff && node.val < best))
      best = node.val;
    node = target < node.val ? node.left : node.right;
  }
  return best;
}
