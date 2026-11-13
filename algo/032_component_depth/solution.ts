/**
 * Component Depth — reference solution.
 *
 * Recursive DFS: a node's depth is 1 + the deepest of its children (a leaf
 * is 1, an empty tree is 0). Every node is visited exactly once.
 *
 * Time:  O(n).
 * Space: O(h) call stack, where h is the tree height. Node's default stack
 *        comfortably handles the 5000-deep chain in the tests; for the
 *        million-deep follow-up, switch to an explicit stack of
 *        `[node, depth]` pairs and take the running max.
 */

export interface ComponentNode {
  id: string;
  type?: string;
  children: ComponentNode[];
}

export function componentDepth(root: ComponentNode | null): number {
  if (root === null) return 0;

  let deepestChild = 0;
  for (const child of root.children) {
    deepestChild = Math.max(deepestChild, componentDepth(child));
  }
  return 1 + deepestChild;
}
