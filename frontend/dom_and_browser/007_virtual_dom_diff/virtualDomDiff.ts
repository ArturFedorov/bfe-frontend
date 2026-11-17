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

function diffProps(
  oldProps: Record<string, any>,
  newProps: Record<string, any>,
): Record<string, any> | null {
  const changed: Record<string, any> = {};
  let hasChanged = false;

  for (const key of new Set([
    ...Object.keys(oldProps),
    ...Object.keys(newProps),
  ])) {
    if (!Object.is(oldProps[key], newProps[key])) {
      changed[key] = newProps[key];
      hasChanged = true;
    }
  }

  return hasChanged ? changed : null;
}

function diffChildren(
  oldChildren: (VNode | string)[],
  newChildren: (VNode | string)[],
): Patch[] {
  const patches: Patch[] = [];
  const length = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < length; i++) {
    const patch = diff(oldChildren[i] ?? null, newChildren[i] ?? null);
    if (patch !== null) patches.push(patch);
  }

  return patches;
}

export function diff(
  oldTree: VNode | string | null,
  newTree: VNode | string | null,
): Patch | null {
  if (oldTree === null && newTree === null) return null;
  if (oldTree === null) return { type: 'CREATE', node: newTree! };
  if (newTree === null) return { type: 'REMOVE' };

  if (typeof oldTree === 'string' || typeof newTree === 'string') {
    return oldTree === newTree ? null : { type: 'REPLACE', node: newTree };
  }

  if (oldTree.type !== newTree.type) return { type: 'REPLACE', node: newTree };

  if (oldTree === newTree) return null;

  const props = diffProps(oldTree.props, newTree.props);
  const children = diffChildren(oldTree.children, newTree.children);

  if (props === null && children.length === 0) return null;

  return { type: 'UPDATE', props: props ?? {}, children };
}
