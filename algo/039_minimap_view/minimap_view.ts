export interface ComponentNode {
  id: string;
  type?: string;
  children: ComponentNode[];
}

export function minimapView(root: ComponentNode | null): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
