export class RandomNode {
  constructor(
    public val: number,
    public next: RandomNode | null = null,
    public random: RandomNode | null = null,
  ) {}
}

/** Returns a deep copy of a linked list whose nodes also carry a `random` pointer. */
export function copyRandomList(head: RandomNode | null): RandomNode | null {
  // TODO: implement
  throw new Error('Not implemented');
}
