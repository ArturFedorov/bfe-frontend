# 1. Get Elements By Class Name

**Difficulty:** Easy
**Topics:** DOM Traversal, Recursion

---

## Description

Implement your own `document.getElementsByClassName()`. Given a DOM tree root node and a class name string, return an array of all descendant elements that contain the given class name. The root element itself should **not** be included in the result.

Elements may have multiple classes separated by spaces. An element matches if the given `className` is one of its classes.

## Examples

```
Given the following DOM structure:
<div id="root" class="container">
  <p class="text highlight">Hello</p>
  <span class="text">World</span>
  <div>
    <p class="highlight">Nested</p>
  </div>
</div>

getElementsByClassName(root, "text")
// => [<p class="text highlight">, <span class="text">]

getElementsByClassName(root, "highlight")
// => [<p class="text highlight">, <p class="highlight">]
```

## Constraints

- `root` is a valid DOM node with `children` and `classList` (or `className`) properties
- `className` is a single class name (no spaces)
- Return results in document order (depth-first)

## Approach Hints

<details>
<summary>Hint 1</summary>
Use recursion or a stack/queue to traverse all descendant nodes.
</details>

<details>
<summary>Hint 2</summary>
Check if an element's classList contains the target className using `classList.contains()` or by splitting the `className` string.
</details>

<details>
<summary>Hint 3</summary>
Remember to skip the root element itself — only its descendants should be collected.
</details>
