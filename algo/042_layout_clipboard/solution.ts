export interface LayoutNode {
  id: string;
  text?: string;
  children: LayoutNode[];
}

interface RawNode {
  id: string;
  text?: string;
  children?: RawNode[];
}

export function serialize(root: LayoutNode | null): string {
  return JSON.stringify(root);
}

export function deserialize(data: string): LayoutNode | null {
  const raw = JSON.parse(data) as RawNode | null;
  return raw == null ? null : toNode(raw);
}

function toNode(rawRoot: RawNode): LayoutNode {
  const make = (raw: RawNode): LayoutNode =>
    raw.text !== undefined
      ? { id: raw.id, text: raw.text, children: [] }
      : { id: raw.id, children: [] };

  const root = make(rawRoot);
  const stack: Array<[RawNode, LayoutNode]> = [[rawRoot, root]];
  let top = stack.pop();

  while (top) {
    const [raw, node] = top;

    for (const rawChild of raw.children ?? []) {
      const child = make(rawChild);
      node.children.push(child);
      stack.push([rawChild, child]);
    }

    top = stack.pop();
  }

  return root;
}
