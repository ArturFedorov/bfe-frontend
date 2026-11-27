import { TreeNode } from '../_shared/structures';

/** Convert a BST in place into a sorted circular doubly linked list; returns the smallest node. */
export function treeToDoublyList(root: TreeNode | null): TreeNode | null {
  if (!root) return null;

  // Iterative in-order traversal, linking each node to the previously visited one.
  let first: TreeNode | null = null;
  let prev: TreeNode | null = null;
  const stack: TreeNode[] = [];
  let node: TreeNode | null = root;

  while (node || stack.length > 0) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    const current = stack.pop() as TreeNode;
    const nextToVisit = current.right;
    if (prev) {
      prev.right = current;
      current.left = prev;
    } else {
      first = current;
    }
    prev = current;
    node = nextToVisit;
  }

  const head = first as TreeNode;
  const tail = prev as TreeNode;
  tail.right = head;
  head.left = tail;
  return head;
}
