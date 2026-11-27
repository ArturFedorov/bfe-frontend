import { TreeNode } from '../_shared/structures';

/** Values of all nodes exactly k edges from target (any order). */
export function distanceK(
  root: TreeNode | null,
  target: TreeNode,
  k: number,
): number[] {
  if (!root) return [];

  // Parent pointers turn the tree into an undirected graph; then BFS k levels.
  const parent = new Map<TreeNode, TreeNode | null>([[root, null]]);
  const stack: TreeNode[] = [root];
  while (stack.length > 0) {
    const node = stack.pop() as TreeNode;
    for (const child of [node.left, node.right]) {
      if (child) {
        parent.set(child, node);
        stack.push(child);
      }
    }
  }

  const seen = new Set<TreeNode>([target]);
  let frontier: TreeNode[] = [target];
  for (let dist = 0; dist < k && frontier.length > 0; dist++) {
    const next: TreeNode[] = [];
    for (const node of frontier) {
      for (const nb of [node.left, node.right, parent.get(node) ?? null]) {
        if (nb && !seen.has(nb)) {
          seen.add(nb);
          next.push(nb);
        }
      }
    }
    frontier = next;
  }
  return frontier.map((node) => node.val);
}
