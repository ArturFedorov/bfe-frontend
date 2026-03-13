# 21. Implement JSON.stringify

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Recursion, Serialization

---

## Description

Implement a `jsonStringify` function that converts a JavaScript value to a JSON string, mimicking the behavior of `JSON.stringify`.

```typescript
function jsonStringify(value: any): string | undefined
```

---

## Examples

### Example 1
```typescript
jsonStringify({ a: 1, b: "hello" }); // '{"a":1,"b":"hello"}'
```

### Example 2
```typescript
jsonStringify([1, null, "test"]); // '[1,null,"test"]'
```

---

## Constraints

- `undefined` and functions return `undefined` at the top level
- `undefined` values in objects are omitted
- `NaN`, `Infinity`, and `-Infinity` become `"null"`
- Strings must be wrapped in double quotes
- No need to handle circular references or `toJSON` methods

---

## Approach Hints

<details><summary>Hint 1</summary>
Handle each type separately: string, number, boolean, null, array, object.
</details>

<details><summary>Hint 2</summary>
Use `typeof` and `Array.isArray()` to determine the value type.
</details>

<details><summary>Hint 3</summary>
Recurse into arrays and object values.
</details>

---

## Related Problems

- Implement JSON.parse
- Implement Deep Clone
