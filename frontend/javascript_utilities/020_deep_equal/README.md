# 20. Implement Deep Equal

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Recursion, Type Checking

---

## Description

Implement a `deepEqual` function that performs a deep equality comparison between two values. It should handle primitives, objects, arrays, `Date`, `RegExp`, and edge cases like `NaN` and `+0`/`-0`.

```typescript
function deepEqual(a: any, b: any): boolean
```

---

## Examples

### Example 1
```typescript
deepEqual({ a: { b: 1 } }, { a: { b: 1 } }); // true
deepEqual({ a: 1 }, { a: 2 }); // false
```

### Example 2
```typescript
deepEqual(NaN, NaN); // true
deepEqual(+0, -0);   // false
```

---

## Constraints

- `NaN` should be equal to `NaN`
- `+0` should NOT be equal to `-0`
- `null` should NOT be equal to `undefined`
- Date and RegExp objects should be compared by value

---

## Approach Hints

<details><summary>Hint 1</summary>
Use `Object.is()` for primitive comparison — it handles `NaN` and `+0`/`-0` correctly.
</details>

<details><summary>Hint 2</summary>
Check if both values are the same type before comparing their contents.
</details>

<details><summary>Hint 3</summary>
For objects, compare all keys recursively and ensure both have the same number of keys.
</details>

---

## Related Problems

- Implement Deep Clone
- Implement Object.assign
