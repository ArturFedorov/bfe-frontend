export interface LayoutNode {
  type: string;
  children: LayoutNode[];
}

export function isSymmetricLayout(root: LayoutNode | null): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}
