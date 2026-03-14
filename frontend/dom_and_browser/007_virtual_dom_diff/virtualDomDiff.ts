export interface VNode {
  type: string;
  props: Record<string, any>;
  children: (VNode | string)[];
}

export type Patch =
  | { type: 'CREATE'; node: VNode | string }
  | { type: 'REMOVE' }
  | { type: 'REPLACE'; node: VNode | string }
  | { type: 'UPDATE'; props: Record<string, any>; children: Patch[] };

export function diff(
  oldTree: VNode | string | null,
  newTree: VNode | string | null,
): Patch | null {
  return null;
}
