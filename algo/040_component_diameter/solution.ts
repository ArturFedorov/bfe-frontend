/**
 * Component Diameter — reference solution.
 *
 * Post-order DFS that returns each subtree's height in edges (a leaf is 0)
 * and folds the diameter as a side effect. At every node the longest path
 * *through* that node is the sum of its two deepest child heights plus the
 * two connecting edges — tracked as `first` and `second` while iterating the
 * children, so an n-ary node is handled in O(children) rather than all pairs.
 *
 * Time:  O(n) — single traversal.
 * Space: O(h) call stack (h = tree height; the 5000-deep chain in the tests
 *        fits Node's default stack).
 */

export interface ComponentNode {
  id: string;
  type?: string;
  children: ComponentNode[];
}

export function componentDiameter(root: ComponentNode | null): number {
  if (root === null) return 0;

  let diameter = 0;

  /** Returns the height (edges to the deepest leaf) of `node`'s subtree. */
  const height = (node: ComponentNode): number => {
    let first = -1; // tallest child height (-1 means "no child")
    let second = -1; // second tallest

    for (const child of node.children) {
      const h = height(child);
      if (h > first) {
        second = first;
        first = h;
      } else if (h > second) {
        second = h;
      }
    }

    // Edges through this node: (first + 1) + (second + 1). With one child
    // `second` is -1, so the path is just first + 1 — no double counting.
    diameter = Math.max(diameter, first + 1 + (second + 1));

    return first + 1;
  };

  height(root);
  return diameter;
}
