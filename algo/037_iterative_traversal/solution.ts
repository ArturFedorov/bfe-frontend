/**
 * Iterative Traversal — reference solution (no recursion).
 *
 * preOrder:  push root; pop, record, push right then left (so left is
 *            processed first).
 * inOrder:   walk down the left spine pushing nodes; pop, record, then move
 *            to the popped node's right child and repeat.
 * postOrder: the "reverse modified pre-order" trick — a pre-order that
 *            visits right before left yields (node, right, left); reversing
 *            that gives (left, right, node) = post-order. We build it into
 *            an array and reverse once at the end, which is equivalent to
 *            the two-stack approach but with a single explicit stack.
 *
 * Time:  O(n) per traversal.
 * Space: O(h) stack, where h is the tree height (plus O(n) for the output).
 */

export interface RenderNode {
  id: string;
  left: RenderNode | null;
  right: RenderNode | null;
}

export function preOrderIterative(root: RenderNode | null): string[] {
  const order: string[] = [];
  if (root === null) return order;

  const stack: RenderNode[] = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    order.push(node.id);
    // LIFO: push right first so the left child is popped (visited) first.
    if (node.right !== null) stack.push(node.right);
    if (node.left !== null) stack.push(node.left);
  }
  return order;
}

export function inOrderIterative(root: RenderNode | null): string[] {
  const order: string[] = [];
  const stack: RenderNode[] = [];
  let current: RenderNode | null = root;

  while (current !== null || stack.length > 0) {
    // Descend the left spine, deferring each node until its left side is done.
    while (current !== null) {
      stack.push(current);
      current = current.left;
    }
    const node = stack.pop()!;
    order.push(node.id);
    current = node.right;
  }
  return order;
}

export function postOrderIterative(root: RenderNode | null): string[] {
  const reversed: string[] = [];
  if (root === null) return reversed;

  // Pre-order with children swapped: node, right, left.
  const stack: RenderNode[] = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    reversed.push(node.id);
    if (node.left !== null) stack.push(node.left);
    if (node.right !== null) stack.push(node.right);
  }

  // Reversing (node, right, left) gives (left, right, node) = post-order.
  return reversed.reverse();
}
