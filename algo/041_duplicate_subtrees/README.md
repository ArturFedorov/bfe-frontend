# 041. Duplicate Subtrees

**Difficulty:** Hard
**Topics:** Trees, Canonical Serialization, Hash Maps

---

## Description

A design-system audit looks for copy-pasted UI worth extracting into a shared
component. Given a component tree where every node has a unique `id` and a
`type`, find all groups of nodes whose subtrees are **structurally
identical**: same `type` at every position and same shape (child counts and
order), ids ignored. Return an array of groups, each group being the ids of
the duplicate subtree roots — only groups with 2 or more members. Within a
group, ids appear in the order the nodes are first met in a pre-order walk;
groups are ordered by the first appearance of any member. The standard trick
is a canonical serialization of every subtree plus a map from serialization
to node ids.

## Examples

```ts
const btn = (id: string) => ({ id, type: 'button', children: [] });

const tree = {
  id: 'root', type: 'page', children: [
    { id: 'cardA', type: 'card', children: [btn('b1')] },
    { id: 'cardB', type: 'card', children: [btn('b2')] },
    btn('b3'),
  ],
};

duplicateSubtrees(tree);
// [
//   ['cardA', 'cardB'],   // identical card subtrees
//   ['b1', 'b2', 'b3'],   // identical button leaves (including those inside the cards)
// ]

duplicateSubtrees({ id: 'solo', type: 'div', children: [] }); // []
duplicateSubtrees(null);                                      // []
```

## Constraints

- `0 <= number of nodes <= 50_000`.
- `id`s are unique non-empty strings; `type`s repeat freely.
- Same `type` alone is not enough — child structure must match exactly,
  including child order.
- Nodes inside a duplicated subtree also join their own groups (see `b1`/`b2`
  in the example).
- Empty tree or no duplicates returns `[]`.

## Target

O(n) total serialization work (serialize each subtree once, bottom-up) — not
O(n²) pairwise comparison.

## Interviewer follow-up

Your serialization strings can grow to O(n) each, making the total O(n²) in
the worst case. How does interning subtree signatures as integer ids (hash
consing) fix that?
