# 19. Implement Deep Clone

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Recursion, Object Manipulation

---

## Description

Implement a `deepClone` function that creates a deep copy of any value. It should handle:

- Primitives
- Plain objects and arrays
- `Date`, `RegExp`, `Map`, `Set`
- Circular references

```typescript
function deepClone<T>(value: T): T
```

---

## Examples

### Example 1
```typescript
const obj = { a: { b: 1 } };
const cloned = deepClone(obj);
cloned.a.b = 2;
console.log(obj.a.b); // 1 (unchanged)
```

### Example 2
```typescript
const circular: any = { x: 1 };
circular.self = circular;
const cloned = deepClone(circular);
cloned.self === cloned; // true
```

---

## Constraints

- Must handle circular references without infinite recursion
- Cloned objects must not share references with the original
- Special types (`Date`, `RegExp`, `Map`, `Set`) must be properly reconstructed

---

## Approach Hints

<details><summary>Hint 1</summary>
Use a `WeakMap` to track already-cloned objects for circular reference handling.
</details>

<details><summary>Hint 2</summary>
Check `instanceof` for special types and reconstruct them accordingly.
</details>

<details><summary>Hint 3</summary>
Recursively clone each property/element.
</details>

---

## Related Problems

- Implement Deep Equal
- Implement Object.assign
