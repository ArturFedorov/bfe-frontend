# 016. Search Highlight

**Difficulty:** Hard
**Topics:** Tree Traversal, Sliding Window, Word Matching, Search

---

## Description

A browser-style find-in-page feature works on a page modeled as a tree of nodes, where each node
may carry a text fragment and/or children. The page's full text is the concatenation of every
node's words in depth-first order: a node's own text comes first, then each child's text in order.
Given the root and a multi-word search query, find every place where the query's words appear as
an exact consecutive word sequence in that combined text — a match may sit entirely inside one
node or **span node boundaries** (siblings, or a parent flowing into its child). Return the ids of
all nodes that contribute at least one word to at least one match, so the UI can highlight them.

Normalization: text and query are split into words on whitespace (spaces, tabs, newlines), and
words compare with exact, case-insensitive equality — `"Hello"` matches `"hello"`, but `"fox"`
does not match `"foxes"`.

## Examples

```ts
const page: PageNode = {
  id: 'root',
  children: [
    { id: 'p1', text: 'hello world' },
    { id: 'p2', text: 'foo bar' },
  ],
};

searchHighlight(page, 'world foo');   // ['p1', 'p2']  (match spans the sibling boundary)
searchHighlight(page, 'hello world'); // ['p1']        (match inside a single node)
searchHighlight(page, 'world bar');   // []            ('foo' sits between them)
```

## Constraints

- `PageNode` is `{ id: string; text?: string; children?: PageNode[] }`; ids are unique. Nodes
  with no text (or whitespace-only text) contribute no words but their children still count.
- Word order in the combined text is depth-first pre-order: node text first, then children
  left to right.
- Matching is at word granularity: exact word equality, case-insensitive, no partial-word or
  substring matches.
- If the query has no words, or has more words than the whole page, return `[]`.
- The result contains each qualifying node id once, in depth-first document order; if the query
  matches in several places, the result is the union of all contributing nodes.
- The tree can hold `100_000+` nodes; total words `W` up to a few hundred thousand, query length
  `q` small.

## Target

One DFS to collect `(word, nodeId)` pairs — O(W) — then a word-level scan for query occurrences,
O(W·q); rebuilding concatenated subtree strings per node (O(W²)) will fail the large-input test.

## Interviewer follow-up

The page is now live: nodes get edited, inserted, and removed while the highlight must stay
current — which parts of your flattened word list can you update incrementally, and when is
re-running the whole search actually the right call?
