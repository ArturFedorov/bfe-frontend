export class ParentNode {
  constructor(
    public val: number,
    public left: ParentNode | null = null,
    public right: ParentNode | null = null,
    public parent: ParentNode | null = null,
  ) {}
}

/** Returns the lowest common ancestor of `p` and `q` using parent pointers. */
export function lowestCommonAncestor(p: ParentNode, q: ParentNode): ParentNode {
  // Like intersecting two linked lists: each pointer walks its own path then
  // the other's, so both cover depth(p) + depth(q) steps and meet at the LCA.
  let a: ParentNode = p;
  let b: ParentNode = q;
  while (a !== b) {
    a = a.parent ?? q;
    b = b.parent ?? p;
  }
  return a;
}
