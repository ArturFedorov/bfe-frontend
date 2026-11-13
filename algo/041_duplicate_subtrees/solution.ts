/**
 * Duplicate Subtrees — reference solution (hash consing).
 *
 * Bottom-up DFS assigns every subtree a small integer *signature*. A node's
 * key is its `type` plus the signatures of its children in order; identical
 * keys intern to the same integer. Because children are represented by their
 * integer signature rather than their full serialization, each key is
 * O(1 + children) long and the total work is O(n) — avoiding the O(n²)
 * blow-up of naive string serialization on deep trees.
 *
 * Grouping/ordering: each node's pre-order index is recorded on entry. Two
 * structurally identical subtrees can never nest, and for non-nested nodes
 * post-order and pre-order agree on relative order, so appending ids to a
 * signature's bucket during the post-order walk already yields pre-order
 * within each group. Groups are then sorted by their first member's
 * pre-order index.
 *
 * Time:  O(n) expected (hash-map keyed by short strings).
 * Space: O(n) for the interning table and buckets, O(h) call stack.
 */

export interface ComponentNode {
  id: string;
  type: string;
  children: ComponentNode[];
}

interface Bucket {
  ids: string[];
  firstSeen: number; // pre-order index of the first member
}

export function duplicateSubtrees(root: ComponentNode | null): string[][] {
  if (root === null) return [];

  const signatureOf = new Map<string, number>(); // structural key -> int
  const buckets = new Map<number, Bucket>(); // int signature -> members
  let preOrderCounter = 0;

  /** Returns the interned structural signature of `node`'s subtree. */
  const visit = (node: ComponentNode): number => {
    const preIndex = preOrderCounter++;

    const childSigs: number[] = [];
    for (const child of node.children) {
      childSigs.push(visit(child));
    }

    // `type` may contain any characters, so separate it from the child list
    // with a delimiter that cannot appear in a joined list of integers.
    const key = `${node.type}#${childSigs.join(',')}`;
    let sig = signatureOf.get(key);
    if (sig === undefined) {
      sig = signatureOf.size;
      signatureOf.set(key, sig);
    }

    const bucket = buckets.get(sig);
    if (bucket === undefined) {
      buckets.set(sig, { ids: [node.id], firstSeen: preIndex });
    } else {
      bucket.ids.push(node.id);
    }

    return sig;
  };

  visit(root);

  return [...buckets.values()]
    .filter((b) => b.ids.length >= 2)
    .sort((a, b) => a.firstSeen - b.firstSeen)
    .map((b) => b.ids);
}
