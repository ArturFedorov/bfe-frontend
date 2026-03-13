# 6. Serialize DOM Tree

**Difficulty:** Medium
**Topics:** Tree Serialization, JSON, Recursion

---

## Description

Implement two functions to convert a DOM-like tree structure to and from JSON:

- **`serialize(node)`**: Convert a `DOMNode` tree into a JSON string.
- **`deserialize(json)`**: Parse a JSON string back into a `DOMNode` tree.

A `DOMNode` has a `tag`, optional `attrs` (key-value pairs), and optional `children` (which can be other `DOMNode` objects or text strings).

## Examples

```ts
const node: DOMNode = {
  tag: "div",
  attrs: { class: "container" },
  children: [
    { tag: "p", children: ["Hello World"] },
    { tag: "span", attrs: { id: "info" } }
  ]
};

const json = serialize(node);
const restored = deserialize(json);
// restored should deeply equal node
```

## Constraints

- `tag` is always a non-empty string
- `attrs` is an optional object with string keys and string values
- `children` is an optional array of `DOMNode` or `string` elements
- `serialize` and `deserialize` should be inverse operations (roundtrip)

## Approach Hints

<details>
<summary>Hint 1</summary>
`JSON.stringify` and `JSON.parse` can handle the heavy lifting, but make sure your structure is consistent.
</details>

<details>
<summary>Hint 2</summary>
Decide how to handle optional fields — omit them if undefined, or always include them with defaults.
</details>

<details>
<summary>Hint 3</summary>
Test the roundtrip: `deserialize(serialize(node))` should produce a deeply equal copy of `node`.
</details>
