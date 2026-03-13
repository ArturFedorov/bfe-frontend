# 3. Nested Checkboxes

**Difficulty:** Hard  
**Topics:** DOM manipulation, tree data structures, indeterminate state, recursion

---

## Description

Build a nested checkbox tree component. Each node can have children. Checking a parent checks all its children. If only some children are checked, the parent becomes indeterminate. The component provides a `getState()` method to retrieve the current tree state.

## Requirements

- Render a tree of checkboxes with labels based on the provided data
- Checking a parent checkbox checks all descendant children
- Unchecking a parent unchecks all descendant children
- If some (but not all) children are checked, the parent is in the indeterminate state
- If all children are checked, the parent becomes checked automatically
- `getState()` returns the current state of the checkbox tree
- Support arbitrarily deep nesting

## Examples

```ts
const container = document.getElementById('tree')!;

const tree = createNestedCheckboxes(container, [
  {
    label: 'Fruits',
    children: [
      { label: 'Apple' },
      { label: 'Banana' },
      { label: 'Cherry', children: [{ label: 'Bing Cherry' }, { label: 'Rainier Cherry' }] },
    ],
  },
]);

console.log(tree.getState());
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Use recursion to render the tree. For each node, create a checkbox + label, and if the node has children, create a nested container and recurse.
</details>

<details>
<summary>Hint 2</summary>
When a checkbox changes, propagate downward (check/uncheck all descendants) and upward (recalculate parent state based on children).
</details>

<details>
<summary>Hint 3</summary>
Use the <code>HTMLInputElement.indeterminate</code> property to set the visual indeterminate state. This is a DOM property, not an HTML attribute.
</details>
