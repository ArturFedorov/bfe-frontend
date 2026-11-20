export interface LayoutNode {
  type: string;
  children: LayoutNode[];
}

export function isSymmetricLayout(root: LayoutNode | null): boolean {
  if (!root) return true;

  // Twin cursors as an explicit stack of mirrored pairs, so deep trees cannot overflow the call stack.
  const stack: [LayoutNode, LayoutNode][] = [[root, root]];

  while (stack.length > 0) {
    const [left, right] = stack.pop()!;

    if (left.type !== right.type) return false;
    if (left.children.length !== right.children.length) return false;

    const count = left.children.length;

    // Pairing the same node with itself (the root, or a middle child) only needs half the children.
    const limit = left === right ? Math.ceil(count / 2) : count;

    for (let i = 0; i < limit; i++) {
      stack.push([left.children[i], right.children[count - 1 - i]]);
    }
  }

  return true;
}
