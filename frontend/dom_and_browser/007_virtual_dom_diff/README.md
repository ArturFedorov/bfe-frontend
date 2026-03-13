# 7. Virtual DOM Diff

**Difficulty:** Hard
**Topics:** Virtual DOM, Tree Diffing, Reconciliation

---

## Description

Implement a simplified virtual DOM diffing algorithm. Given an old virtual tree and a new virtual tree, produce a `Patch` that describes the minimal changes needed to transform the old tree into the new tree.

Patch types:
- **CREATE**: A new node was added
- **REMOVE**: An existing node was removed
- **REPLACE**: A node was replaced with a different type
- **UPDATE**: Same node type but props or children changed

## Examples

```ts
const oldTree: VNode = { type: "div", props: { class: "old" }, children: [] };
const newTree: VNode = { type: "div", props: { class: "new" }, children: [] };

diff(oldTree, newTree);
// => { type: "UPDATE", props: { class: "new" }, children: [] }

diff(oldTree, null);
// => { type: "REMOVE" }

diff(null, newTree);
// => { type: "CREATE", node: newTree }
```

## Constraints

- Nodes are either `VNode` objects or strings (text nodes)
- `null` represents absence of a node
- Return `null` if the trees are identical (no changes needed)
- Props comparison is shallow (one level deep)

## Approach Hints

<details>
<summary>Hint 1</summary>
Handle the base cases first: null-to-node (CREATE), node-to-null (REMOVE), different types (REPLACE).
</details>

<details>
<summary>Hint 2</summary>
For text nodes (strings), compare them directly. If different, it's a REPLACE.
</details>

<details>
<summary>Hint 3</summary>
For UPDATE patches, diff props by comparing old and new prop objects, then recursively diff children arrays using their indices.
</details>
