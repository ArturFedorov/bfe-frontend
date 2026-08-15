export interface RenderNode {
  id: string;
  left: RenderNode | null;
  right: RenderNode | null;
}

export interface RenderOrder {
  preOrder: string[];
  inOrder: string[];
  postOrder: string[];
}

export function renderOrder(root: RenderNode | null): RenderOrder {
  // TODO: implement
  throw new Error('Not implemented');
}
