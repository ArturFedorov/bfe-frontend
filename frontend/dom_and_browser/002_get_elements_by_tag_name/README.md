# 2. Get Elements By Tag Name

**Difficulty:** Easy
**Topics:** DOM Traversal, Recursion

---

## Description

Implement your own `document.getElementsByTagName()`. Given a DOM tree root node and a tag name string, return an array of all descendant elements that match the given tag name. The comparison should be **case-insensitive**.

If the tag name is `"*"`, return all descendant elements.

## Examples

```
Given the following DOM structure:
<div id="root">
  <p>Hello</p>
  <P>World</P>
  <span>
    <p>Nested</p>
  </span>
</div>

getElementsByTagName(root, "p")
// => [<p>Hello</p>, <P>World</P>, <p>Nested</p>]

getElementsByTagName(root, "*")
// => [<p>, <P>, <span>, <p>]
```

## Constraints

- `root` is a valid DOM node with `children` and `tagName` properties
- `tagName` is a non-empty string
- Tag name matching is case-insensitive
- Return results in document order (depth-first)

## Approach Hints

<details>
<summary>Hint 1</summary>
Normalize both the target tag name and the element's tagName to the same case (e.g., uppercase) before comparing.
</details>

<details>
<summary>Hint 2</summary>
Handle the wildcard `"*"` as a special case that matches every element.
</details>

<details>
<summary>Hint 3</summary>
Traverse the tree depth-first, collecting matching elements in order. Remember to exclude the root node itself.
</details>
