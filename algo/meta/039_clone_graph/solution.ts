export class GraphNode {
  constructor(
    public val: number,
    public neighbors: GraphNode[] = [],
  ) {}
}

/** Deep copy of a connected undirected graph, preserving cycles. */
export function cloneGraph(node: GraphNode | null): GraphNode | null {
  if (!node) return null;

  // Map original -> clone doubles as the visited set; BFS wires neighbors.
  const clones = new Map<GraphNode, GraphNode>([
    [node, new GraphNode(node.val)],
  ]);
  const queue: GraphNode[] = [node];
  for (let head = 0; head < queue.length; head++) {
    const original = queue[head];
    const copy = clones.get(original) as GraphNode;
    for (const nb of original.neighbors) {
      let nbCopy = clones.get(nb);
      if (!nbCopy) {
        nbCopy = new GraphNode(nb.val);
        clones.set(nb, nbCopy);
        queue.push(nb);
      }
      copy.neighbors.push(nbCopy);
    }
  }
  return clones.get(node) as GraphNode;
}
