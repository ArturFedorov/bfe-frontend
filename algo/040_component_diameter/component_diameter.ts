export interface ComponentNode {
  id: string;
  type?: string;
  children: ComponentNode[];
}

export function componentDiameter(root: ComponentNode | null): number {
  // TODO: implement
  throw new Error('Not implemented');
}
