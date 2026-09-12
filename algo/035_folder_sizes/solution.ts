export interface FsNode {
  name: string;
  kind: 'file' | 'folder';
  size?: number; // present on files only
  children: FsNode[]; // empty on files
}

export function folderSizes(root: FsNode): Map<string, number> {
  if (root.kind === 'file') {
    throw new Error('Root must be folder');
  }

  const result = new Map<string, number>();

  const visit = (node: FsNode, path: string): number => {
    if (node.kind === 'file') {
      return node.size ?? 0;
    }

    let total = 0;
    for (const child of node.children) {
      total += visit(child, `${path}/${child.name}`);
    }

    result.set(path, total);
    return total;
  };

  visit(root, root.name);

  return result;
}
