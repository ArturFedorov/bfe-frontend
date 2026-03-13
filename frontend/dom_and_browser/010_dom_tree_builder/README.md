# 10. DOM Tree Builder

**Difficulty:** Medium
**Topics:** Tree Data Structure, DOM API, OOP

---

## Description

Build a `DOMTree` class that simulates a simplified DOM tree structure. Each node has a `tag`, a list of `children`, and a reference to its `parent`.

Implement the following methods:
- **`appendChild(child)`**: Add a child node. Sets the child's parent.
- **`removeChild(child)`**: Remove a child node. Should throw if the child is not found.
- **`querySelector(tag)`**: Find the first descendant with the given tag (depth-first).
- **`querySelectorAll(tag)`**: Find all descendants with the given tag (depth-first).

## Examples

```ts
const root = new DOMTree("div");
const p = new DOMTree("p");
const span = new DOMTree("span");

root.appendChild(p);
root.appendChild(span);

root.querySelector("p");      // => p
root.querySelectorAll("span"); // => [span]
p.parent;                      // => root
```

## Constraints

- `tag` is a non-empty string
- `removeChild` should throw an `Error` if the child is not a direct child of the node
- `querySelector` and `querySelectorAll` search descendants only (not the node itself)
- Search is depth-first in document order

## Approach Hints

<details>
<summary>Hint 1</summary>
In `appendChild`, push the child to `this.children` and set `child.parent = this`.
</details>

<details>
<summary>Hint 2</summary>
In `removeChild`, find the child's index. If not found, throw an error. Otherwise splice it out and set `child.parent = null`.
</details>

<details>
<summary>Hint 3</summary>
For `querySelector`, do a DFS and return the first match. For `querySelectorAll`, collect all matches during the DFS.
</details>
