/**
 * Reference solution for 007 — virtual DOM diff.
 *
 * Compare two virtual trees and describe how to turn the old one into the new
 * one as a `Patch` (or `null` when nothing changed).
 *
 * Decision order, cheapest first:
 *   1. both absent                 → null
 *   2. old absent                  → CREATE new
 *   3. new absent                  → REMOVE
 *   4. a text node is involved     → null if equal, else REPLACE
 *   5. element types differ        → REPLACE (no point diffing the subtree)
 *   6. same type                   → shallow-diff props, recurse on children;
 *                                    null if neither produced anything
 */
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

/**
 * Shallow prop diff. The result holds only the keys that changed, with their
 * NEW value — a removed prop shows up as `undefined` so an applier knows to
 * unset it. Returns null when the props are shallow-equal.
 */
function diffProps(
  oldProps: Record<string, any>,
  newProps: Record<string, any>,
): Record<string, any> | null {
  const changed: Record<string, any> = {};
  let hasChanges = false;

  for (const key of new Set([
    ...Object.keys(oldProps),
    ...Object.keys(newProps),
  ])) {
    if (!Object.is(oldProps[key], newProps[key])) {
      changed[key] = newProps[key];
      hasChanges = true;
    }
  }

  return hasChanges ? changed : null;
}

/**
 * Children are matched positionally (index i ↔ index i) — the simple, keyless
 * strategy. Positions beyond the shorter list become CREATE or REMOVE patches.
 *
 * The exported `Patch` type has no "no-op" variant and `children` cannot hold
 * nulls, so only the positions that actually changed are included, in index
 * order. (A production patch would also carry each child's index.)
 */
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
  // 1–3: presence changes.
  if (oldTree === null && newTree === null) return null;
  if (oldTree === null) return { type: 'CREATE', node: newTree! };
  if (newTree === null) return { type: 'REMOVE' };

  // 4: text nodes have no props/children — they are equal or replaced wholesale.
  // (Also covers text ↔ element, which is always a REPLACE.)
  if (typeof oldTree === 'string' || typeof newTree === 'string') {
    return oldTree === newTree ? null : { type: 'REPLACE', node: newTree };
  }

  // 5: a different element type means a different DOM node — rebuild it.
  if (oldTree.type !== newTree.type) return { type: 'REPLACE', node: newTree };

  // 6: same element — fast path for the very same object, then look inside.
  if (oldTree === newTree) return null;

  const props = diffProps(oldTree.props, newTree.props);
  const children = diffChildren(oldTree.children, newTree.children);

  if (props === null && children.length === 0) return null;

  return { type: 'UPDATE', props: props ?? {}, children };
}
