/**
 * A page is a tree of nodes; each node may carry a text fragment and/or
 * children. The page's readable text is the concatenation of all words in
 * depth-first pre-order (a node's own text, then its children in order).
 */
export interface PageNode {
  id: string;
  text?: string;
  children?: PageNode[];
}

/**
 * Finds every occurrence of `query` as an exact consecutive word sequence
 * in the page's combined text — matches may span node boundaries — and
 * returns the ids of all nodes contributing at least one word to at least
 * one match.
 *
 * Words are split on whitespace and compared case-insensitively.
 *
 * @param root - the page tree
 * @param query - a multi-word search string
 * @returns unique contributing node ids in depth-first document order;
 *          `[]` when the query is empty or never matches
 */
export function searchHighlight(root: PageNode, query: string): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
