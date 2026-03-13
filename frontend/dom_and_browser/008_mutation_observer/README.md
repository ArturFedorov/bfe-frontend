# 8. Mutation Observer (Change Detector)

**Difficulty:** Medium
**Topics:** Object Comparison, Deep Diff, Recursion

---

## Description

Implement a change detection function that compares two objects (representing states of a data model) and returns an array of `Change` objects describing the differences.

Change types:
- **add**: A property exists in the new object but not in the old one
- **remove**: A property exists in the old object but not in the new one
- **update**: A property exists in both but has a different value

For nested objects, changes should include a dot-separated `path`.

## Examples

```ts
detectChanges(
  { name: "Alice", age: 30 },
  { name: "Bob", age: 30, email: "bob@test.com" }
);
// => [
//   { type: "update", path: "name", oldValue: "Alice", newValue: "Bob" },
//   { type: "add", path: "email", newValue: "bob@test.com" }
// ]
```

## Constraints

- Both inputs are plain objects (no class instances, functions, etc.)
- Nested objects should be compared recursively
- Array values are compared by value (not recursively diffed element-by-element)
- Return changes sorted by path is optional but encouraged

## Approach Hints

<details>
<summary>Hint 1</summary>
Collect all unique keys from both objects. For each key, determine if it was added, removed, or potentially updated.
</details>

<details>
<summary>Hint 2</summary>
If both values for a key are plain objects, recurse with an updated path prefix. Otherwise compare directly.
</details>

<details>
<summary>Hint 3</summary>
Use `JSON.stringify` for comparing arrays and non-object values, or use a deep equality check.
</details>
