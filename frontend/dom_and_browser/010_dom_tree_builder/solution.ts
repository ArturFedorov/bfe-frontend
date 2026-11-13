/**
 * Reference solution for 010 — DOMTree builder.
 *
 * A minimal DOM-like tree: each node knows its `tag`, its `children` (ordered)
 * and its `parent`. The two invariants the mutators must keep in sync:
 *   - `child.parent === node`  ⇔  `node.children` includes `child`
 *   - a node has at most one parent
 * Both query methods search DESCENDANTS only, depth-first (document order).
 */
export class DOMTree {
  tag: string;
  children: DOMTree[];
  parent: DOMTree | null;

  constructor(tag: string) {
    this.tag = tag;
    this.children = [];
    this.parent = null;
  }

  /** Append `child` as the last child; like the DOM, a node that already has a parent is moved. */
  appendChild(child: DOMTree): DOMTree {
    if (child.parent) child.parent.removeChild(child); // keep "one parent" true
    this.children.push(child);
    child.parent = this;
    return child;
  }

  /** Detach `child`; throws if it is not a DIRECT child of this node. */
  removeChild(child: DOMTree): DOMTree {
    const index = this.children.indexOf(child);
    if (index === -1) {
      throw new Error(
        `removeChild: <${child.tag}> is not a child of <${this.tag}>`,
      );
    }
    this.children.splice(index, 1);
    child.parent = null;
    return child;
  }

  /** First descendant with the given tag, or null. */
  querySelector(tag: string): DOMTree | null {
    for (const child of this.children) {
      if (child.tag === tag) return child; // pre-order: check the node before its subtree
      const found = child.querySelector(tag);
      if (found) return found;
    }
    return null;
  }

  /** All descendants with the given tag, in document order. */
  querySelectorAll(tag: string): DOMTree[] {
    const matches: DOMTree[] = [];
    for (const child of this.children) {
      if (child.tag === tag) matches.push(child);
      matches.push(...child.querySelectorAll(tag));
    }
    return matches;
  }
}
