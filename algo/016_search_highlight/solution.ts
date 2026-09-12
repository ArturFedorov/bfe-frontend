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

interface TaggedWord {
  word: string;
  nodeId: string;
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
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);

  const stream: TaggedWord[] = [];

  const flatten = (node: PageNode): void => {
    if (node.text) {
      for (const word of node.text.toLowerCase().split(/\s+/)) {
        if (word) stream.push({ word, nodeId: node.id });
      }
    }

    for (const child of node.children || []) {
      flatten(child);
    }
  };

  flatten(root);

  const matched = new Set<string>();

  for (let start = 0; start + queryWords.length <= stream.length; start++) {
    let isMatch = true;

    for (let j = 0; j < queryWords.length; j++) {
      if (stream[start + j].word !== queryWords[j]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      for (let j = 0; j < queryWords.length; j++) {
        matched.add(stream[start + j].nodeId);
      }
    }
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const { nodeId } of stream) {
    if (matched.has(nodeId) && !seen.has(nodeId)) {
      seen.add(nodeId);
      result.push(nodeId);
    }
  }

  return result;
}
