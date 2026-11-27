export class GraphNode {
  constructor(
    public val: number,
    public neighbors: GraphNode[] = [],
  ) {}
}

/** Deep copy of a connected undirected graph, preserving cycles. */
export function cloneGraph(node: GraphNode | null): GraphNode | null {
  // TODO: implement
  throw new Error('Not implemented');
}
