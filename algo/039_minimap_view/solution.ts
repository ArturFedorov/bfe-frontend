export interface ComponentNode {
  id: string;
  type?: string;
  children: ComponentNode[];
}

export function minimapView(root: ComponentNode | null): string[] {
  if (!root) return [];

  const result: string[] = [];
  let level: ComponentNode[] = [root];

  // BFS level by level: the last node of each level is the visible one.
  while (level.length > 0) {
    result.push(level[level.length - 1].id);

    const next: ComponentNode[] = [];
    for (const node of level) {
      for (const child of node.children) next.push(child);
    }
    level = next;
  }

  return result;
}
