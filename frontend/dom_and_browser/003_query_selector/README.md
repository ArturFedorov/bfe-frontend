# 3. Query Selector

**Difficulty:** Medium
**Topics:** DOM Traversal, CSS Selectors, String Parsing

---

## Description

Implement a basic version of `document.querySelector()`. Given a DOM tree root node and a CSS selector string, return the **first** descendant element that matches the selector, or `null` if no element matches.

Support the following selector types:
- **Tag selector:** `"div"`, `"p"`, `"span"`
- **Class selector:** `".className"`
- **ID selector:** `"#idName"`
- **Nested selectors:** `"div p"` (descendant combinator)

## Examples

```
Given:
<div id="root">
  <p class="intro" id="first">Hello</p>
  <div>
    <p class="body">World</p>
  </div>
</div>

querySelector(root, "#first")     // => <p class="intro" id="first">
querySelector(root, ".body")      // => <p class="body">
querySelector(root, "p")          // => <p class="intro" id="first">
querySelector(root, "div p")      // => <p class="intro" id="first">
querySelector(root, ".missing")   // => null
```

## Constraints

- `root` is a valid DOM node with `children`, `tagName`, `id`, and `classList` properties
- Selectors are simple (tag, class, id) or space-separated descendant selectors
- Return the first match in document order (depth-first), or `null`

## Approach Hints

<details>
<summary>Hint 1</summary>
Parse the selector to determine its type (tag, class, or id) by checking the first character.
</details>

<details>
<summary>Hint 2</summary>
For nested selectors like `"div p"`, split by spaces and match each part in sequence against ancestors and descendants.
</details>

<details>
<summary>Hint 3</summary>
Use depth-first traversal and return immediately upon finding the first match.
</details>
