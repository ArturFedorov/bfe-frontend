/**
 * Reference solution for 005 — flatten a tree in DFS and BFS order.
 *
 * DFS (pre-order): node, then each child's subtree in turn → the call stack
 * (or an explicit stack) does the bookkeeping.
 * BFS (level order): all nodes at depth d before any at depth d+1 → a queue.
 */
export interface TreeNode {
  value: any;
  children: TreeNode[];
}

export function flattenDFS(root: TreeNode): any[] {
  const result: any[] = [];

  const visit = (node: TreeNode): void => {
    result.push(node.value); // pre-order: the node comes before its subtree
    for (const child of node.children) visit(child);
  };

  visit(root);
  return result;
}

export function flattenBFS(root: TreeNode): any[] {
  const result: any[] = [];
  const queue: TreeNode[] = [root];
  let head = 0; // read pointer: O(1) "dequeue" instead of O(n) Array.shift()

  while (head < queue.length) {
    const node = queue[head++];
    result.push(node.value);
    // Children are enqueued behind everything already waiting, so a whole
    // level is emitted before the next level begins.
    for (const child of node.children) queue.push(child);
  }

  return result;
}
