# 037. Iterative Traversal

**Difficulty:** Medium
**Topics:** Trees, Explicit Stack, Iteration

---

## Description

Your recursive traversals from task 033 crash with a stack overflow on
pathologically deep trees exported by a legacy design tool. Re-implement
pre-order, in-order, and post-order traversal of a binary layout tree
**without recursion** — use an explicit stack you manage yourself. Recursion
is forbidden in any form (no helper that calls itself, no mutual recursion,
no trampolines that just hide it); the test suite includes a chain deep
enough that a recursive solution overflows the call stack. Each function
returns the node ids in the corresponding order.

## Examples

```ts
const tree = {
  id: 'root',
  left: { id: 'a', left: null, right: { id: 'b', left: null, right: null } },
  right: { id: 'c', left: null, right: null },
};

preOrderIterative(tree);  // ['root', 'a', 'b', 'c']
inOrderIterative(tree);   // ['a', 'b', 'root', 'c']
postOrderIterative(tree); // ['b', 'a', 'c', 'root']
preOrderIterative(null);  // []
```

## Constraints

- `0 <= number of nodes <= 200_000`; chains may be up to 100_000 deep.
- **No recursion** — an explicit stack (array) only.
- Node `id`s are unique non-empty strings.
- `left` / `right` are a node or `null`.
- An empty tree (`null` root) returns `[]` from every function.

## Target

O(n) time, O(h) extra space per traversal, where h is the tree height.

## Interviewer follow-up

Post-order with a single stack and no "visited" flags is the hard one — walk
through how the two-stack (or reverse-modified-pre-order) trick works and why
it produces post-order.
