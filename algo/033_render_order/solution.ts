/**
 * Render Order — reference solution.
 *
 * One recursive DFS fills all three lists: a node is recorded in `preOrder`
 * on entry (before descending), in `inOrder` between the left and right
 * subtrees, and in `postOrder` on exit (after both children). Doing it in a
 * single walk keeps the three arrays trivially consistent.
 *
 * Time:  O(n) — each node is visited once and pushed three times.
 * Space: O(n) for the output plus O(h) call stack (h = tree height; the
 *        5000-deep chains in the tests fit Node's default stack).
 */

export interface RenderNode {
  id: string;
  left: RenderNode | null;
  right: RenderNode | null;
}

export interface RenderOrder {
  preOrder: string[];
  inOrder: string[];
  postOrder: string[];
}

export function renderOrder(root: RenderNode | null): RenderOrder {
  const result: RenderOrder = { preOrder: [], inOrder: [], postOrder: [] };

  const walk = (node: RenderNode | null): void => {
    if (node === null) return;
    result.preOrder.push(node.id); // mount: parent before children
    walk(node.left);
    result.inOrder.push(node.id); // left subtree, node, right subtree
    walk(node.right);
    result.postOrder.push(node.id); // unmount: children before parent
  };

  walk(root);
  return result;
}
