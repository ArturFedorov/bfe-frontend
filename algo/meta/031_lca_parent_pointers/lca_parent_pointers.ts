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
  // TODO: implement
  throw new Error('Not implemented');
}
