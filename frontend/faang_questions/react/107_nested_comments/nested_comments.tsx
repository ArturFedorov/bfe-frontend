import type { ReactElement } from 'react';

export interface Comment {
  id: string;
  parentId: string | null;
  author: string;
  text: string;
  createdAt: string; // ISO 8601
}

export interface ThreadNode extends Comment {
  children: ThreadNode[];
}

export interface CommentThreadProps {
  comments: readonly Comment[];
  /** Resolves with the server's copy of the comment (its real id). */
  onReply: (parentId: string, text: string) => Promise<Comment>;
  /** Author name used for optimistic comments. */
  currentUser: string;
}

/** Deepest visual level; anything deeper is flattened at this level. */
export const MAX_DEPTH = 4;

/**
 * Nest a flat list into a forest. Children are sorted by `createdAt` asc.
 * Comments whose `parentId` points at a missing comment are treated as roots.
 */
export function buildThread(comments: readonly Comment[]): ThreadNode[] {
  throw new Error('Not implemented');
}

/** Number of comments in the subtree below `node`. */
export function countDescendants(node: ThreadNode): number {
  throw new Error('Not implemented');
}

export function CommentThread(props: CommentThreadProps): ReactElement {
  throw new Error('Not implemented');
}
