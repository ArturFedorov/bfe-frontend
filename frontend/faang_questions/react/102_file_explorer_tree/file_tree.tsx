import type { ReactElement } from 'react';

export interface TreeNode {
  id: string;
  name: string;
  /** Present (even empty) => folder; absent => leaf. */
  children?: TreeNode[];
}

export type FolderState = 'none' | 'some' | 'all';

export interface FileTreeProps {
  nodes: TreeNode[];
  /** Selected LEAF ids. Folders are never stored; they derive from their leaves. */
  value: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Folder ids that start expanded. Default: none. */
  defaultExpanded?: string[];
}

/** Every leaf id under `node` in document order. A leaf returns [its own id]. */
export function leafIds(node: TreeNode): string[] {
  throw new Error('Not implemented');
}

/** 'all' when every leaf under `node` is selected, 'none' when none is, else 'some'. */
export function folderState(node: TreeNode, selected: Set<string>): FolderState {
  throw new Error('Not implemented');
}

export function FileTree(props: FileTreeProps): ReactElement {
  throw new Error('Not implemented');
}
