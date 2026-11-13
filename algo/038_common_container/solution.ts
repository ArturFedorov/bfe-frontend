/**
 * Common Container — reference solution.
 *
 * Single post-order DFS. Each call returns how many of the two target ids
 * live in that subtree (a node matching both ids counts twice, which covers
 * the `idA === idB` case). The first node — in post-order, i.e. the deepest —
 * whose subtree count reaches 2 is the lowest common ancestor; it is latched
 * in `answer` and never overwritten by its ancestors. If the count never
 * reaches 2, at least one id is missing and we throw.
 *
 * Time:  O(n) — one traversal, no separate root-to-node paths.
 * Space: O(h) call stack (h = tree height; the 5000-deep chain in the tests
 *        fits Node's default stack).
 */

export interface ComponentNode {
  id: string;
  type?: string;
  children: ComponentNode[];
}

export function commonContainer(
  root: ComponentNode,
  idA: string,
  idB: string,
): string {
  let answer: string | null = null;

  /** Returns the number of target ids found in `node`'s subtree (0..2). */
  const visit = (node: ComponentNode): number => {
    let count = 0;

    if (node.id === idA) count += 1;
    if (node.id === idB) count += 1;

    for (const child of node.children) {
      count += visit(child);
    }

    // Post-order: the deepest node that sees both targets is the LCA.
    if (count >= 2 && answer === null) {
      answer = node.id;
    }

    return count;
  };

  visit(root);

  if (answer === null) {
    throw new Error(`Node id not found in tree: ${idA} / ${idB}`);
  }

  return answer;
}
