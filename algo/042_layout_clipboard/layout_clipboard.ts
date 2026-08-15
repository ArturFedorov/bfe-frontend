export interface LayoutNode {
  id: string;
  text?: string;
  children: LayoutNode[];
}

export function serialize(root: LayoutNode | null): string {
  // TODO: implement
  throw new Error('Not implemented');
}

export function deserialize(data: string): LayoutNode | null {
  // TODO: implement
  throw new Error('Not implemented');
}
