# 36. Implement Deep Freeze

**Difficulty:** Easy

**Topics:** JavaScript Utilities, Immutability, Recursion

---

## Description

`Object.freeze` is shallow: nested objects stay writable. Implement `deepFreeze`, which freezes a value and everything reachable from it through plain objects and arrays, then returns the same reference.

```typescript
function deepFreeze<T>(value: T): Readonly<T>;
```

Rules:

- Primitives, `null` and functions are returned untouched
- Plain objects and arrays are frozen recursively through their own enumerable properties
- `Date`, `Map` and `Set` instances are left as they are (freezing them does not protect their internal state anyway)
- Cycles must terminate (track visited objects in a `WeakSet`)
- Already-frozen objects are returned without descending (so calling `deepFreeze` twice is cheap)

---

## Examples

### Example 1

```typescript
'use strict';
const config = deepFreeze({
  api: { url: 'https://x', retries: 3 },
  flags: ['a'],
});

config.api.retries = 5; // TypeError in strict mode
config.flags.push('b'); // TypeError
Object.isFrozen(config.api); // true
```

### Example 2

```typescript
const node: any = { name: 'root' };
node.self = node;

deepFreeze(node); // terminates, returns node
```

### Example 3

```typescript
const state = deepFreeze({ cache: new Map() });
state.cache.set('k', 1); // still works: Map internals are not frozen
```

---

## Constraints

- Return the input reference, not a copy
- Do not throw for primitives, `null`, or cyclic graphs
- Do not recurse into `Date`, `Map`, `Set`, or functions

---

## Approach Hints

<details><summary>Hint 1</summary>
Bail out early: `if (value === null || typeof value !== 'object') return value;` then `if (Object.isFrozen(value)) return value;`.
</details>

<details><summary>Hint 2</summary>
Freeze the current object **before** recursing into its children. A cycle then hits an already-frozen object and stops; a `WeakSet` makes the intent explicit.
</details>

<details><summary>Hint 3</summary>
`Object.values(value)` works for both arrays and plain objects. Check `Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype` before descending so you skip Map, Set, Date and class instances.
</details>

---

## Related Problems

- Implement Deep Clone
- Implement Immutable Update Helpers
