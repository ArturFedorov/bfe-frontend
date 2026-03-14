export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export interface FileExplorerOptions {
  container: HTMLElement;
  data: FileNode[];
  onSelect?: (node: FileNode) => void;
}

export function createFileExplorer(options: FileExplorerOptions): {
  getSelected: () => FileNode | null;
  destroy: () => void;
} {
  return { getSelected: () => null, destroy() {} };
}
