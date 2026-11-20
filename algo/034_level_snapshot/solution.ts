export interface ComponentNode {
  id: string;
  type?: string;
  children: ComponentNode[];
}

export function levelSnapshot(root: ComponentNode | null): string[][] {
  const levels: string[][] = [];
  if (!root) return levels;

  // Each iteration holds exactly one level, so memory is bounded by the widest level.
  let current: ComponentNode[] = [root];

  while (current.length > 0) {
    const ids: string[] = [];
    const next: ComponentNode[] = [];

    for (const node of current) {
      ids.push(node.id);
      for (const child of node.children) next.push(child);
    }

    levels.push(ids);
    current = next;
  }

  return levels;
}
