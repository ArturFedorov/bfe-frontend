export interface ComponentNode {
  id: string;
  type?: string;
  children: ComponentNode[];
}

export function commonContainer(
  root: ComponentNode,
  idA: string,
  idB: string,
): string {
  // TODO: implement
  throw new Error('Not implemented');
}
