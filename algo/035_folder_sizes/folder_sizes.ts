export interface FsNode {
  name: string;
  kind: 'file' | 'folder';
  size?: number; // present on files only
  children: FsNode[]; // empty on files
}

export function folderSizes(root: FsNode): Map<string, number> {
  // TODO: implement
  throw new Error('Not implemented');
}
