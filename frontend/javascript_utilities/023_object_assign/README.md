# 23. Implement Object.assign

**Difficulty:** Easy

**Topics:** JavaScript Utilities, Object Manipulation

---

## Description

Implement an `objectAssign` function that copies all enumerable own properties from one or more source objects to a target object, similar to `Object.assign`.

```typescript
function objectAssign(target: any, ...sources: any[]): any
```

---

## Examples

### Example 1
```typescript
objectAssign({ a: 1 }, { b: 2 }); // { a: 1, b: 2 }
```

### Example 2
```typescript
objectAssign({}, { a: 1 }, { a: 2, b: 3 }); // { a: 2, b: 3 }
```

---

## Constraints

- Only copy enumerable own properties
- Later sources overwrite earlier ones for the same key
- This is a shallow copy — nested objects are not cloned
- Return the target object (mutated)
- Skip `null` and `undefined` sources

---

## Approach Hints

<details><summary>Hint 1</summary>
Iterate over each source and copy its own enumerable properties to the target.
</details>

<details><summary>Hint 2</summary>
Use `Object.keys()` or a `for...in` loop with `hasOwnProperty` check.
</details>

---

## Related Problems

- Implement Deep Clone
- Implement Object.create
