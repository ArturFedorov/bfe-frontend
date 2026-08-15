export interface ComponentNode {
  id: string;
  type?: string;
  children: ComponentNode[];
}

export function componentDepth(root: ComponentNode | null): number {
  // TODO: implement
  throw new Error('Not implemented');
}
